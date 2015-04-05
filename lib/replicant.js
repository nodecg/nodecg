'use strict';

var inherits = require('inherits'); // Used instead of full `util` package for the sake of easier browserification
var EventEmitter = require('events').EventEmitter;
var Nested = require('nested-observe');
var objectPath = require('object-path');
var log = require('./logger')('replicant');
var replicator = require('./replicator');

var inBrowser = typeof document !== 'undefined';

// Make Replicant inherit the prototype of EventEmitter
// This is the second of two steps required to make each Replicant an EventEmitter
inherits(Replicant, EventEmitter);
module.exports = Replicant;

function Replicant(name, bundle, opts, nodecg) {
    // Call EventEmitter constructor on `this`
    // This is the first of two steps required to make each Replicant an EventEmitter
    //EventEmitter.call(this);

    var self = this;
    opts = opts || {};
    this.name = name;
    this.bundle = bundle || nodecg.bundleName;
    this.opts = opts;
    this.revision = 0;

    var value = opts.defaultValue;
    Object.defineProperty(this, 'value', {
        get: function() {
            return value;
        },
        set: function(newValue) {
            console.log('in the setter');
            if (newValue === value) return value;
            if (inBrowser) {
                console.log('running assignment');

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
            }, function(newValue, revision) {
                self.revision = revision;
                value = newValue;
            });
        });
    } else {
        replicator.declare(name, bundle, opts.defaultValue);
    }

    // Overwrites the value completely, and assigns a new one.
    // Does not send a `change` argument with the change event.
    function assignValue(newValue, revision) {
        var oldVal = value;
        unobserveValue();
        value = newValue;
        if (typeof value === 'object') {
            observeValue();
        }
        if (revision) {
            self.revision = revision;
        }
        self.emit('change', oldVal, newValue);
    }

    function observeValue() {
        Nested.observe(value, onValueChange);
    }

    function onValueChange(rawChanges) {
        try {
            var formattedChanges = [];
            rawChanges.forEach(function(change) {
                var path = change.path.substring(1).replace('/','.');
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

                dispatchChanges(name, bundle, formattedChanges);

                if (inBrowser) {
                    nodecg.socket.emit('changeReplicant', {
                        name: name,
                        bundle: bundle,
                        changes: formattedChanges
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
        Nested.unobserve(value, onValueChange);
    }

    // Handle assignment that overwrites the whole value
    if (inBrowser) {
        nodecg.socket.on('replicantAssigned', replicantAssigned);
    } else {
        replicator.on('replicantAssigned', replicantAssigned);
    }

    function replicantAssigned(data) {
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
        if (data.name !== self.name || self.bundle !== bundle) {
            return;
        }

        if (data.revision !== (self.revision + 1)) {
            log.debug('[%s] Replicant "%s" not at head revision (ours %s, theirs %s), fetching latest...', bundle, name, revision, data.revision);
            if (inBrowser) {
                nodecg.socket.emit('readReplicant', function(data) {
                    assignValue(data.value, data.revision);
                });
            } else {
                var latest = replicator.find(name, bundle);
                assignValue(latest.value, latest.revision);
            }
            return;
        }

        data.changes.forEach(function(change) {
            var oldVal = value;
            unobserveValue();
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
}
