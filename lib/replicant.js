'use strict';

var inherits = require('inherits'); // Used instead of full `util` package for the sake of easier browserification
var EventEmitter = require('events').EventEmitter;
var Nested = require('nested-observe');
var objectPath = require('object-path');
var replicator = require('./replicator');
var equal = require('deep-equal');
var clone = require('clone');
var uuid = require('uuid');

var inBrowser = typeof document !== 'undefined';
var declaredReplicants = {};

// Make Replicant inherit the prototype of EventEmitter
inherits(Replicant, EventEmitter);
module.exports = Replicant;

function Replicant(name, bundle, opts, nodecg) {
    if (!name || typeof name !== 'string') {
        throw new Error('Must supply a name when instantiating a Replicant');
    }

    if (!nodecg || typeof nodecg !== 'object') {
        throw new Error('Must supply a nodecg API context when instantiating a Replicant');
    }

    // Make declaredReplicants accessible from the nodecg api
    if (!nodecg.hasOwnProperty('declaredReplicants')) {
        nodecg.declaredReplicants = declaredReplicants;
    }

    // Load logger
    var log = require('./logger')('Replicant/' + bundle + '.' + name);

    // If replicant already exists, return that.
    if (declaredReplicants.hasOwnProperty(bundle)) {
        if (declaredReplicants[bundle].hasOwnProperty(name)) {
            log.warn('Attempted to re-declare replicant "%s" in bundle "%s", returning existing replicant instead',
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
    this.status = 'undeclared';
    this.id = uuid.v4();
    if (typeof opts.persistent === 'undefined') opts.persistent = true;

    // When running in the browser, we have to wait until the socket joins the room
    // and the replicant is fully declared before running any additional commands.
    // After this time, commands do not need to be added to the queue and are simply executed immediately.
    var queue = [];

    function addToQueue(fn, args) {
        queue.push({fn: fn, args: args});
    }

    function processQueue() {
        queue.forEach(function(item) {
            item.fn.apply(this, item.args);
        });
    }

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

            log.replicants('running setter with', newValue);

            if (self.status !== 'declared') {
                addToQueue(doBrowserSetter, [newValue]);
                return;
            }

            if (inBrowser) {
                doBrowserSetter(newValue);
            } else {
                replicator.assign(name, bundle, newValue);
            }
        },
        enumerable: true
    });

    function doBrowserSetter(newValue) {
        // Run the assignment and emit the change event immediately,
        // with the assumption that the dispatched assignment will be accepted.
        assignValue(newValue);

        nodecg.socket.emit('assignReplicant', {
            name: name,
            bundle: bundle,
            value: newValue
        });
    }

    function doBrowserDeclare(defaultValue) {
        if (self.status === 'declared' || self.status === 'declaring') return;
        self.status = 'declaring';
        nodecg.socket.emit('joinRoom', bundle, function() {
            nodecg.socket.emit('declareReplicant', {
                name: name,
                bundle: bundle,
                defaultValue: defaultValue,
                persistent: opts.persistent
            }, function(data) {
                log.replicants('declareReplicant callback (value: %s, revision: %s)', data.value, data.revision);
                var didMismatchReassignment = false;
                if (self.revision !== data.revision || !equal(value, data.value)) {
                    unobserveValue();
                    value = defaultValue;
                    observeValue();
                    assignValue(data.value, data.revision);
                    didMismatchReassignment = true;
                }
                self.status = 'declared';
                self.emit('declared', data);
                if (queue.length) {
                    processQueue();
                } else if (!didMismatchReassignment) {
                    self.emit('change', undefined, data.value);
                }
            });
        });
    }

    if (inBrowser) {
        doBrowserDeclare(opts.defaultValue);
    } else {
        (function() {
            var result = replicator.findOrDeclare(name, bundle, opts.defaultValue, opts.persistent);
            assignValue(result.value, result.revision);
            self.status = 'declared';
            processQueue();
        })();
    }

    // Overwrites the value completely, and assigns a new one.
    // Does not send a `change` argument with the change event.
    function assignValue(newValue, revision) {
        unobserveValue();
        var oldValue = clone(value);
        value = newValue;
        observeValue();
        if (revision) {
            self.revision = revision;
        }
        self.emit('change', oldValue, value);
    }

    function observeValue() {
        if (typeof value === 'object' && value !== null) {
            Nested.observe(value, onValueChange);
        }
    }

    function replayChange(changes) {
        try {
            unobserveValue();
            var oldValue = clone(value);
            changes.forEach(function(change) {
                switch(change.type) {
                    case 'add':
                    case 'update':
                        objectPath.set(value, change.path, change.newValue);
                        break;
                    case 'splice':
                        var arr = objectPath.get(value, change.path);
                        var args = clone(change.added);
                        args.unshift(change.removedCount);
                        args.unshift(change.index);
                        Array.prototype.splice.apply(arr, args);
                        objectPath.set(value, change.path, arr);
                        break;
                    case 'delete':
                        objectPath.del(value, change.path);
                        break;
                }
            });
            observeValue();
            dispatchChanges(oldValue, changes);
        } catch (e) {
            log.error(e.stack);
        }
    }

    function dispatchChanges(changes) {
        if (inBrowser) {
            nodecg.socket.emit('changeReplicant', {
                name: name,
                bundle: bundle,
                changes: changes,
                revision: self.revision,
                originatorId: self.id
            }, function(value, revision) {
                // This callback is only invoked in cases of failure
                log.replicants('Not at head revision (ours %s, theirs %s). Change aborted & head revision applied.',
                    self.revision, revision);
                assignValue(value, revision);
            });
        } else {
            replicator.change(name, bundle, changes, self.id);
        }
    }

    function onValueChange(rawChanges) {
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
                case 'splice':
                    formattedChanges.push({
                        type: 'splice',
                        path: path,
                        index: change.index,
                        removed: change.removed,
                        removedCount: change.removed.length,
                        added: change.object.slice(change.index, change.index+change.addedCount),
                        addedCount: change.addedCount
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
        });

        if (self.status === 'declared') {
            dispatchChanges(formattedChanges);
        } else {
            addToQueue(dispatchChanges, [formattedChanges]);
        }
    }

    function unobserveValue() {
        if (typeof value === 'object' && value !== null) {
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
        self.emit('assignmentAccepted', data);
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
        else if (data.revision !== (self.revision + 1)) {
            log.debug('[%s] Replicant "%s" not at head revision (ours %s, theirs %s), fetching latest...',
                bundle, name, self.revision, data.revision);
            fullUpdate();
            return;
        }

        log.replicants('replicantChanged', data);

        var oldValue = clone(value);
        var replayChanges = clone(data.changes);
        replayChanges.reverse();
        replayChanges.forEach(function(change) {
            switch(change.type) {
                case 'add':
                    objectPath.del(oldValue, change.path);
                    break;
                case 'update':
                    objectPath.set(oldValue, change.path, change.oldValue);
                    break;
                case 'splice':
                    var arr = objectPath.get(oldValue, change.path);
                    if (!arr) {
                        arr = [];
                    }
                    var args = clone(change.removed);
                    args.unshift(change.addedCount);
                    args.unshift(change.index);
                    Array.prototype.splice.apply(arr, args);
                    objectPath.set(oldValue, change.path, arr);
                    break;
                case 'delete':
                    objectPath.set(oldValue, change.path, change.oldValue);
                    break;
                default:
                    objectPath.set(oldValue, change.path, change.oldValue);
            }
        });

        if (data.originatorId !== self.id) {
            unobserveValue();
            data.changes.forEach(function(change) {
                switch(change.type) {
                    case 'add':
                    case 'update':
                        objectPath.set(value, change.path, change.newValue);
                        break;
                    case 'splice':
                        var arr = objectPath.get(value, change.path);
                        var args = clone(change.added);
                        args.unshift(change.removedCount);
                        args.unshift(change.index);
                        Array.prototype.splice.apply(arr, args);
                        objectPath.set(value, change.path, arr);
                        break;
                    case 'delete':
                        objectPath.del(value, change.path);
                        break;
                }
            });
            observeValue();
        }

        self.revision = data.revision;
        self.emit('change', oldValue, value, data.changes);
    }

    function fullUpdate() {
        if (inBrowser) {
            nodecg.readReplicant(name, bundle, function(data) {
                self.emit('fullUpdate', data);
                assignValue(data.value, data.revision);
            });
        } else {
            var latest = replicator.find(name, bundle);
            self.emit('fullUpdate', latest);
            assignValue(latest.value, latest.revision);
        }
    }

    // If we lose connection, redeclare everything on reconnect
    if (inBrowser) {
        nodecg.socket.on('disconnect', function() {
            self.status = 'undeclared';
        });
        nodecg.socket.on('reconnect', function() {
            doBrowserDeclare(value);
        });
    }
}
