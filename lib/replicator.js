'use strict';

var log = require('./logger')('replicator');
var server = require('./server');
var io = server.getIO();
var EventEmitter = require('events').EventEmitter;
var objectPath = require('object-path');
var clone = require('clone');
var LocalStorage = require('node-localstorage').LocalStorage;
var fs = require('fs');
var replicants = {};
var stores = {};

module.exports = exports = new EventEmitter();
exports.setMaxListeners(9999);

// Make 'db/replicants' folder if it doesn't exist
if (!fs.existsSync('db/replicants')) {
    fs.mkdirSync('db/replicants');
}

server.on('started', function() {
    io.sockets.on('connection', function (socket) {
        socket.on('declareReplicant', function (data, cb) {
            log.replicants('declareReplicant', data);
            var returnVal = findOrDeclare(data.name, data.bundle, data.defaultValue, data.persistent);
            if (typeof cb === 'function') {
                cb(returnVal);
            }
        });

        socket.on('assignReplicant', function (data) {
            log.replicants('assignReplicant', data);
            assign(data.name, data.bundle, data.value);
        });

        socket.on('changeReplicant', function (data, cb) {
            log.replicants('changeReplicant', data);
            var current = find(data.name, data.bundle);
            if (current && current.revision !== data.revision) {
                log.replicants('Change request %s:%s had mismatched revision (ours %s, theirs %s), invoking callback with fullupdate',
                    data.bundle, data.name, current.revision, data.revision);
                if (typeof cb === 'function') {
                    cb(current.value, current.revision);
                }
            } else {
                change(data.name, data.bundle, data.changes, data.originatorId);
            }
        });

        socket.on('readReplicant', function (data, cb) {
            log.replicants('readReplicant', data);
            var replicant = find(data.name, data.bundle);
            if (typeof cb === 'function') {
                if (replicant) {
                    cb(replicant.value);
                } else {
                    cb();
                }
            }
        });
    });
});

function declare(name, bundle, defaultValue, persistent) {
    // Initialize the parent object if not present
    if (!replicants.hasOwnProperty(bundle)) {
        replicants[bundle] = {};
    }

    // Initialize the storage object if not present
    if (!stores.hasOwnProperty(bundle)) {
        stores[bundle] = new LocalStorage('./db/replicants/' + bundle);
    }

    // Get the existing value, if any, and JSON parse if its an object
    var existingValue = stores[bundle].getItem(name + '.rep');
    try {
        existingValue = JSON.parse(existingValue);
    } catch (e) {}

    if (persistent && existingValue) {
        replicants[bundle][name] = {
            value: existingValue,
            revision: 0,
            persistent: persistent
        };
        log.replicants('Replicant "%s.%s" discovered in localStorage, loaded existing value:',
            bundle, name, existingValue);
    } else {
        replicants[bundle][name] = {
            value: defaultValue,
            revision: 0,
            persistent: persistent
        };
        saveReplicant(name, bundle, defaultValue);
        log.replicants('Replicant "%s.%s" declared:', bundle, name, defaultValue);
    }



    emitToAll(bundle, 'replicantDeclared', {
        name: name,
        bundle: bundle,
        value: replicants[bundle][name].value,
        revision: replicants[bundle][name].revision,
        persistent: persistent
    });

    return replicants[bundle][name];
}

function assign(name, bundle, value) {
    if (!exists(name, bundle)) {
        log.error('Attempted to assign non-existent replicant "%s.%s"', bundle, name);
        return;
    }

    // Give extension replicants a chance to delete their old observe hooks
    exports.emit(bundle, 'preReplicantAssigned', {
        name: name,
        bundle: bundle,
        currentValue: replicants[bundle][name].value
    });

    var oldValue = replicants[bundle][name].value;
    replicants[bundle][name].value = value;
    replicants[bundle][name].revision++;

    log.replicants('Replicant "%s.%s" assigned:', bundle, name, value);

    emitToAll(bundle, 'replicantAssigned', {
        name: name,
        bundle: bundle,
        oldValue: oldValue,
        newValue: value,
        revision: replicants[bundle][name].revision
    });

    saveReplicant(name, bundle, value);
}

function change(name, bundle, changes, originatorId) {
    if (!exists(name, bundle)) {
        log.error('Attempted to change non-existent replicant "%s.%s"', bundle, name);
        return;
    }

    // Make any server-side replicants stop observation, so that we can safely apply the changes
    // Without creating redundant change events.
    // They will automatically re-observe when we emit 'replicantChanged' at the bottom of this block.
    exports.emit('unobserveReplicant', name, bundle);

    changes.forEach(function(change) {
        switch(change.type) {
            case 'add':
            case 'update':
                objectPath.set(replicants[bundle][name].value, change.path, change.newValue);
                break;
            case 'splice':
                var arr = objectPath.get(replicants[bundle][name].value, change.path);
                var args = clone(change.added);
                args.unshift(change.removedCount);
                args.unshift(change.index);
                Array.prototype.splice.apply(arr, args);
                objectPath.set(replicants[bundle][name].value, change.path, arr);
                break;
            case 'delete':
                objectPath.del(replicants[bundle][name].value, change.path);
                break;
        }
    });

    replicants[bundle][name].revision++;

    emitToAll(bundle, 'replicantChanged', {
        name: name,
        bundle: bundle,
        revision: replicants[bundle][name].revision,
        changes: changes,
        originatorId: originatorId
    });

    saveReplicant(name, bundle, replicants[bundle][name].value);
}

function exists(name, bundle) {
    if (!replicants.hasOwnProperty(bundle)) return false;
    return replicants[bundle].hasOwnProperty(name);
}

function find(name, bundle) {
    // If there are no variables for that bundle, return undefined
    if (!replicants.hasOwnProperty(bundle)) return;

    // If that variable doesn't exist for that bundle, return undefined
    if (!replicants[bundle].hasOwnProperty(name)) return;

    // Return the variable's current value
    return replicants[bundle][name];
}

function findOrDeclare(name, bundle, defaultValue, persistent) {
    var existingReplicant = find(name, bundle);
    if (typeof(existingReplicant) !== 'undefined') {
        log.replicants('Replicant %s (%s) already existed:', name, bundle, existingReplicant);
        return existingReplicant;
    }

    return declare(name, bundle, defaultValue, persistent);
}

function emitToAll(bundle, eventName, data) {
    // Emit to extensions using EventEmitter
    exports.emit(eventName, data);

    // Emit to clients (in the given bundle's room) using Socket.IO
    log.replicants('emitting %s to %s:', eventName, bundle, data);
    io.to(bundle).emit(eventName, data);
}

function saveReplicant(name, bundle, value) {
    process.nextTick(function() {
        if (!replicants[bundle][name].persistent) return;
        if (typeof value === 'object') {
            value = JSON.stringify(value);
        }
        stores[bundle].setItem(name + '.rep', value || '');
    });
}

exports.declare = declare;
exports.assign = assign;
exports.change = change;
exports.exists = exists;
exports.find = find;
exports.findOrDeclare = findOrDeclare;
exports.emitToAll = emitToAll;
exports.saveReplicant = saveReplicant;
exports.replicants = replicants;
