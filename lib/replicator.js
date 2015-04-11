'use strict';

var log = require('./logger')('replicator');
var server = require('./server');
var io = server.getIO();
var EventEmitter = require('events').EventEmitter;
var objectPath = require('object-path');
var replicants = {};

module.exports = exports = new EventEmitter();

server.on('started', function() {
    io.sockets.on('connection', function (socket) {
        socket.on('declareReplicant', function (data, cb) {
            log.replicants('declareReplicant', data);
            var returnVal = exports.findOrDeclare(data.name, data.bundle, data.defaultValue);
            if (typeof cb === 'function') {
                cb(returnVal);
            }
        });

        socket.on('assignReplicant', function (data) {
            log.replicants('assignReplicant', data);
            exports.assign(data.name, data.bundle, data.value);
        });

        socket.on('changeReplicant', function (data, cb) {
            log.replicants('changeReplicant', data);
            var current = exports.find(data.name, data.bundle);
            if (current && current.revision !== data.revision) {
                log.replicants('Change request %s:%s had mismatched revision (ours %s, theirs %s), invoking callback with fullupdate',
                    data.bundle, data.name, current.revision, data.revision);
                if (typeof cb === 'function') {
                    cb(current.value, current.revision);
                }
            } else {
                exports.change(data.name, data.bundle, data.changes);
            }
        });

        socket.on('readReplicant', function (data, cb) {
            log.replicants('readReplicant', data);
            var returnVal = exports.find(data.name, data.bundle);
            if (typeof cb === 'function') {
                cb(returnVal);
            }
        });
    });
});

exports.declare = function(name, bundle, defaultValue) {
    // Initialize the parent object if not present
    if (!replicants.hasOwnProperty(bundle)) {
        replicants[bundle] = {};
    }

    replicants[bundle][name] = {
        value: defaultValue,
        revision: 0
    };

    this.emitToAll(bundle, 'replicantDeclared', {
        name: name,
        bundle: bundle,
        value: defaultValue,
        revision: 0
    });
    log.replicants('Replicant %s (%s) declared:', name, bundle, defaultValue);

    // TODO: persist to disk

    return { value: defaultValue, revision: 0 };
};

exports.assign = function(name, bundle, value) {
    if (!this.exists(name, bundle)) {
        log.error('Attempted to assign non-existent replicant "%s.%s"', bundle, name);
        return;
    }

    replicants[bundle][name].value = value;
    replicants[bundle][name].revision++;

    log.replicants('Replicant "%s.%s" assigned:', bundle, name, value);

    this.emitToAll(bundle, 'replicantAssigned', {
        name: name,
        bundle: bundle,
        value: replicants[bundle][name].value,
        revision: replicants[bundle][name].revision
    });

    // TODO: persist to disk
};

exports.change = function(name, bundle, changes) {
    if (!this.exists(name, bundle)) {
        log.error('Attempted to change non-existent replicant "%s.%s"', bundle, name);
        return;
    }

    changes.forEach(function(change) {
        switch(change.type) {
            case 'add':
            case 'update':
                objectPath.set(replicants[bundle][name].value, change.path, change.newValue);
                break;
            case 'delete':
                objectPath.del(replicants[bundle][name].value, change.path);
                break;
        }
    });

    replicants[bundle][name].revision++;

    this.emitToAll(bundle, 'replicantChanged', {
        name: name,
        bundle: bundle,
        revision: replicants[bundle][name].revision,
        changes: changes
    });

    // TODO: persist to disk
};

exports.exists = function(name, bundle) {
    if (!replicants.hasOwnProperty(bundle)) return false;
    return replicants[bundle].hasOwnProperty(name);
};

exports.find = function(name, bundle) {
    // If there are no variables for that bundle, return undefined
    if (!replicants.hasOwnProperty(bundle)) return;

    // If that variable doesn't exist for that bundle, return undefined
    if (!replicants[bundle].hasOwnProperty(name)) return;

    // Return the variable's current value
    return replicants[bundle][name];
};

exports.findOrDeclare = function(name, bundle, defaultValue) {
    var existingReplicant = this.find(name, bundle);
    if (typeof(existingReplicant) !== 'undefined') {
        log.replicants('Replicant %s (%s) already existed:', name, bundle, existingReplicant);
        return existingReplicant;
    }

    return this.declare(name, bundle, defaultValue);
};

exports.emitToAll = function(bundle, eventName, data) {
    // Emit to extensions using EventEmitter
    this.emit(eventName, data);

    // Emit to clients (in the given bundle's room) using Socket.IO
    log.replicants('emitting %s to %s:', eventName, bundle, data);
    io.to(bundle).emit(eventName, data);
};

// Used only in tests
server.on('resetReplicants', function() {
    for (var key in replicants) {
        if (!replicants.hasOwnProperty(key)) continue;
        delete replicants[key];
    }
    replicants = {};
});
