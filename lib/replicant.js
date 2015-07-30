'use strict';

var inherits = require('inherits'); // Used instead of full `util` package for the sake of easier browserification
var EventEmitter = require('events').EventEmitter;
var Nested = require('nested-observe');
var objectPath = require('object-path');
var replicator = require('./replicator');
var io = require('./server').getIO();
var clone = require('clone');
var uuid = require('uuid');
var declaredReplicants = {};

// Make Replicant inherit the prototype of EventEmitter
inherits(Replicant, EventEmitter);
module.exports = Replicant;
Replicant.declaredReplicants = declaredReplicants;

function Replicant(name, bundle, opts) {
    if (!name || typeof name !== 'string') {
        throw new Error('Must supply a name when instantiating a Replicant');
    }

    if (!bundle || typeof bundle !== 'string') {
        throw new Error('Must supply a bundle name when instantiating a Replicant');
    }

    // Load logger
    var log = require('./logger')('Replicant/' + bundle + '.' + name);

    // If replicant already exists, return that.
    if (declaredReplicants.hasOwnProperty(bundle)) {
        if (declaredReplicants[bundle].hasOwnProperty(name)) {
            return declaredReplicants[bundle][name];
        } else {
            declaredReplicants[bundle][name] = this;
        }
    } else {
        declaredReplicants[bundle] = {};
        declaredReplicants[bundle][name] = this;
    }

    var self = this;
    opts = opts || {};
    this.name = name;
    this.bundle = bundle;
    this.opts = opts;
    this.id = uuid.v4();
    if (typeof opts.persistent === 'undefined') opts.persistent = true;

    /* jshint -W093 */
    function value(newVal) {
        if (arguments.length >= 1) {
            replicator.replicants[bundle][name].value = newVal;
        }
        return replicator.replicants[bundle][name].value;
    }
    /* jshint +W093 */

    Object.defineProperty(this, 'value', {
        get: function() {
            return value();
        },
        set: function(newValue) {
            if (newValue === value()) {
                log.replicants('value unchanged, no action will be taken');
                return value();
            }

            log.replicants('running setter with', newValue);
            unobserveValue();
            replicator.assign(name, bundle, newValue);
            observeValue();
        },
        enumerable: true
    });

    // Declare and observe default
    replicator.findOrDeclare(name, bundle, opts.defaultValue, opts.persistent);
    observeValue();

    function observeValue() {
        if (typeof value() === 'object' && value() !== null) {
            Nested.observe(value(), onChangeObserved);
        }
    }

    function onChangeObserved(rawChanges) {
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

        var oldValue = reverseChanges(value(), formattedChanges);

        // Increment revision
        replicator.replicants[bundle][name].revision++;

        // Emit oldVal, newVal, and changes directly to extension replicant `change` handlers
        self.emit('change', oldValue, value(), formattedChanges);

        // Persist to disk, if enabled for this replicant
        replicator.saveReplicant(name, bundle, value());

        // Emit only the raw changes to browser clients
        io.to(bundle).emit('replicantChanged', {
            name: name,
            bundle: bundle,
            revision: replicator.replicants[bundle][name].revision,
            changes: formattedChanges,
            originatorId: self.id
        });
    }

    function unobserveValue() {
        if (typeof value() === 'object' && value() !== null) {
            Nested.unobserve(value(), onChangeObserved);
        }
    }

    replicator.on('unobserveReplicant', function(name, bundle) {
        if (name === self.name && bundle === self.bundle) {
            unobserveValue();
        }
    });

    replicator.on('preReplicantAssigned', function (data) {
        if (data.name !== name || data.bundle !== bundle) return;
        log.replicants('preReplicantAssigned', data);
        unobserveValue();
    });

    // Handle assignment that overwrites the whole value
    replicator.on('replicantAssigned', function (data) {
        if (data.name !== name || data.bundle !== bundle) return;
        log.replicants('replicantAssigned', data);
        self.emit('change', data.oldValue, data.newValue);
        observeValue();
    });

    // The replicator has already determined the new value, so we just determine the old value.
    replicator.on('replicantChanged', function (data) {
        if (data.name !== name || data.bundle !== bundle) return;
        log.replicants('replicantChanged', data);

        var oldValue = reverseChanges(value(), data.changes);
        self.revision = data.revision;
        self.emit('change', oldValue, value(), data.changes);
    });

    // Walk through changes in reverse, and do the opposite to calculate the old value
    function reverseChanges(startValue, changes) {
        var oldValue = clone(startValue);
        var reversedChanges = clone(changes).reverse();
        reversedChanges.forEach(function(change) {
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
                    var args = change.removed;
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
        return oldValue;
    }
}
