'use strict';

var inherits = require('inherits'); // Used instead of full `util` package for the sake of easier browserification
var EventEmitter = require('events').EventEmitter;
var Nested = require('nested-observe');
var objectPath = require('object-path');
var log = require('./logger')('replicant');
var replicator = require('./replicator');

var inBrowser = typeof document !== 'undefined';

var declaredReplicants = {};

// Make Replicant inherit the prototype of EventEmitter
inherits(Replicant, EventEmitter);
module.exports = Replicant;

function Replicant(name, bundle, opts, nodecg) {
    console.log(declaredReplicants);

    // If replicant already exists, return that.
    if (declaredReplicants.hasOwnProperty(bundle)) {
        if (declaredReplicants[bundle].hasOwnProperty(name)) {
            log.warn('Attempted to re-declare replicant %s in bundle %s, returning existing replicant instead',
                name, bundle);
            return declaredReplicants[bundle][name];
        } else {
            declaredReplicants[bundle][name] = this;
        }
    } else {
        declaredReplicants[bundle] = {};
        declaredReplicants[bundle][name] = this;
    }

    var self = this;
    var value;
    opts = opts || {};
    this.name = name;
    this.bundle = bundle || nodecg.bundleName;
    this.opts = opts;
    this.revision = 0;

    assignValue(opts.defaultValue);

    Object.defineProperty(this, 'value', {
        get: function() {
            return value;
        },
        set: function(newValue) {
            if (newValue === value) {
                log.replicants('value unchanged, no action will be taken');
                return value;
            }
            if (inBrowser) {
                log.replicants('running setter with', newValue);

                // Run the assignment and emit the change event immediately,
                // with the assumption that the dispatched assignment will be accepted.
                assignValue(newValue);

                if (inBrowser) {
                    nodecg.socket.emit('assignReplicant', {
                        name: name,
                        bundle: bundle,
                        value: newValue
                    });
                } else {
                    replicator.assign(newValue);
                }
            }
        },
        enumerable: true
    });

    if (inBrowser) {
        nodecg.socket.emit('joinRoom', bundle, function() {
            nodecg.socket.emit('declareReplicant', {
                name: name,
                bundle: bundle,
                defaultValue: opts.defaultValue
            }, function(data) {
                log.replicants('declareReplicant callback (value: %s, revision: %s)', data.value, data.revision);
                if (self.revision !== data.revision) {
                    assignValue(data.value, data.revision);
                }
            });
        });
    } else {
        replicator.declare(name, bundle, opts.defaultValue);
    }

    // Overwrites the value completely, and assigns a new one.
    // Does not send a `change` argument with the change event.
    function assignValue(newValue, revision) {
        unobserveValue();
        var oldVal = value;
        value = newValue;
        observeValue();
        if (revision) {
            self.revision = revision;
        }
        self.emit('change', oldVal, newValue);
    }

    function observeValue() {
        if (typeof value === 'object') {
            console.log('observing', value);
            Nested.observe(value, onValueChange);
        }
    }

    function onValueChange(rawChanges) {
        try {
            var formattedChanges = [];
            rawChanges.forEach(function(change) {
                var path = change.path.substr(1).replace(/\//g,'.');
                var newVal = objectPath.get(change.root, path);
                switch(change.type) {
                    case 'add':
                        formattedChanges.push({
                            type: 'add',
                            path: path,
                            newValue: newVal
                        });
                        break;
                    case 'update':
                        formattedChanges.push({
                            type: 'update',
                            path: path,
                            oldValue: change.oldValue,
                            newValue: newVal
                        });
                        break;
                    case 'delete':
                        formattedChanges.push({
                            type: 'delete',
                            path: path,
                            oldValue: change.oldValue
                        });
                        break;
                    default:
                        formattedChanges.push({
                            type: 'other',
                            path: path
                        });
                }

                if (inBrowser) {
                    nodecg.socket.emit('changeReplicant', {
                        name: name,
                        bundle: bundle,
                        changes: formattedChanges,
                        revision: self.revision
                    }, function(value, revision) {
                        // This callback is only invoked in cases of failure
                        log.replicants('[%s] Replicant "%s" wasn\'t at head revision (ours %s, theirs %s). Change aborted, head revision applied.'
                            , bundle, name, self.revision, revision);
                        assignValue(value, revision);
                    });
                } else {
                    replicator.change(name, bundle, formattedChanges);
                }
            });
        } catch (e) {
            log.error(e.stack);
        }
    }

    function unobserveValue() {
        if (typeof value === 'object') {
            console.log('unobserving', value);
            Nested.unobserve(value, onValueChange);
        }
    }

    // Handle assignment that overwrites the whole value
    if (inBrowser) {
        nodecg.socket.on('replicantAssigned', replicantAssigned);
    } else {
        replicator.on('replicantAssigned', replicantAssigned);
    }

    function replicantAssigned(data) {
        if (data.name !== name || data.bundle !== bundle) return;
        log.replicants('replicantAssigned', data);
        assignValue(data.value, data.revision);
    }

    // Handle changes to individual properties of the value, if it is an object or array
    // If we're not at the correct revision, request a full update
    if (inBrowser) {
        nodecg.socket.on('replicantChanged', replicantChanged);
    } else {
        replicator.on('replicantChanged', replicantChanged);
    }

    function replicantChanged(data) {
        if (data.name !== name || data.bundle !== bundle) return;
        log.replicants('replicantChanged', data);
        if (data.name !== self.name || self.bundle !== bundle) {
            return;
        }

        if (data.revision !== (self.revision + 1)) {
            log.debug('[%s] Replicant "%s" not at head revision (ours %s, theirs %s), fetching latest...', bundle, name, self.revision, data.revision);
            fullUpdate();
            return;
        }

        data.changes.forEach(function(change) {
            unobserveValue();
            var oldVal = value;
            switch(change.type) {
                case 'add':
                case 'update':
                    objectPath.set(value, change.path, change.newValue);
                    self.emit('change', oldVal, value, change);
                    break;
                case 'delete':
                    objectPath.del(value, change.path);
                    self.emit('change', oldVal, undefined, change);
                    break;
            }
            observeValue();
        });

        self.revision = data.revision;
    }

    function fullUpdate() {
        if (inBrowser) {
            nodecg.readReplicant(name, bundle, function(data) {
                assignValue(data.value, data.revision);
            });
        } else {
            var latest = replicator.find(name, bundle);
            assignValue(latest.value, latest.revision);
        }
    }
}
