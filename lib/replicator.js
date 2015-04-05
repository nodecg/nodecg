'use strict';

var log = require('./logger')('replicator');
var server = require('./server');
var io;
var EventEmitter = require('events').EventEmitter;
var replicants = {};

exports = new EventEmitter();

server.on('started', function() {
    io = server.getIO();
    io.sockets.on('connection', function (socket) {
        socket.on('declareReplicant', function (data, cb) {
            log.replicants('declareReplicant', data);
            var returnVal = exports.findOrDeclare(data.name, data.bundle, data.defaultValue);
            if (typeof cb === 'function') {
                cb(returnVal, 0);
            }
        });

        socket.on('assignReplicant', function (data) {
            log.replicants('assignReplicant', data);
            exports.assign(data.name, data.bundle, data.value);
        });

        socket.on('changeReplicant', function (data, cb) {
            log.replicants('changeReplicant', data);
            var returnVal = exports.change(data.name, data.bundle, data.changes);
            if (typeof cb === 'function') {
                cb(returnVal);
            }
        });

        socket.on('readReplicant', function (data, cb) {
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

    return defaultValue;
};

exports.assign = function(name, bundle, value) {
    if (!this.exists(name, bundle)) {
        log.error('Attempted to assign non-existent replicant %s (%s)', name, bundle);
        return;
    }

    replicants[bundle][name].value = value;
    replicants[bundle][name].revision++;

    log.replicants('Replicant %s (%s) assigned: ', name, bundle, value);
    this.emitToAll(bundle, 'replicantAssigned', {
        name: name,
        bundle: bundle,
        value: value,
        revision: replicants[bundle][name].revision
    });

    // TODO: persist to disk
};

exports.change = function(name, bundle, changes) {
    if (!this.exists(name, bundle)) {
        log.error('Attempted to change non-existent replicant %s (%s)', name, bundle);
        return;
    }

    changes.forEach(function(change) {
        switch(change.type) {
            case 'add':
            case 'update':
                objectPath.set(replicants[bundle][name], change.path, change.newValue);
                break;
            case 'delete':
                objectPath.del(replicants[bundle][name], change.path);
                break;
        }
    });

    replicants[bundle][name].revision++;

    this.emitToAll(bundle, 'replicantChanged', {
        name: name,
        bundle: bundle,
        value: replicants[bundle][name].value,
        revision: replicants[bundle][name].revision
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
    // When NodeCG first starts, it loads extensions before starting the server.
    // At this time, Socket.IO will be undefined.
    if (!io) return;

    // Emit to clients (in the given bundle's room) using Socket.IO
    log.replicants('emitting %s to %s:', eventName, bundle, data);
    io.to(bundle).emit(eventName, data);

    // Emit to extensions using EventEmitter
    this.emit(eventName, data);
};
