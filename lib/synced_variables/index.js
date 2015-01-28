'use strict';
var server = require('../server');
var log = require('../logger')('nodecg/lib/synced_variables');
var EventEmitter = require('events').EventEmitter;
var declaredVars = {};
var io;

exports = new EventEmitter();

server.on('started', function() {
    io = server.getIO();
    io.sockets.on('connection', function (socket) {
        socket.on('declareVariable', function (data, cb) {
            var returnVal = exports.findOrDeclare(data.bundleName, data.variableName, data.initialVal);
            if (typeof cb === 'function')
                cb(returnVal);
        });

        socket.on('assignVariable', function (data) {
            exports.assign(data.bundleName, data.variableName, data.value);
        });

        socket.on('destroyVariable', function (data) {
            exports.destroy(data.bundleName, data.variableName);
        });
    });
});

exports.declare = function(bundleName, variableName, initialVal) {
    // Initialize the parent object if not present
    if (!declaredVars.hasOwnProperty(bundleName))
        declaredVars[bundleName] = {};

    declaredVars[bundleName][variableName] = initialVal;

    this.emitToAll('variableDeclared', {
        bundleName: bundleName,
        variableName: variableName,
        value: initialVal
    });
    log.debug('Variable %s (%s) declared:', variableName, bundleName, initialVal);

    return initialVal;
};

exports.destroy = function(bundleName, variableName) {
    if (declaredVars.hasOwnProperty(bundleName)) {
        // Delete the variable from the bundle, if it exists
        if (declaredVars[bundleName].hasOwnProperty(variableName)) {
            delete declaredVars[bundleName][variableName];
            this.emitToAll('variableDestroyed', {
                bundleName: bundleName,
                variableName: variableName
            });
        }

        // If the bundle has no variables, delete its key
        if (Object.getOwnPropertyNames(declaredVars[bundleName]).length <= 0)
            delete declaredVars[bundleName];
    }
};

exports.assign = function(bundleName, variableName, value) {
    if (!this.exists(bundleName, variableName)) {
        log.error('Attempted to assign non-existant variable %s (%s)', variableName, bundleName);
        return;
    }

    declaredVars[bundleName][variableName] = value;
    log.debug('Variable %s (%s) assigned: ', variableName, bundleName, value);
    this.emitToAll('variableAssigned', {
        bundleName: bundleName,
        variableName: variableName,
        value: value
    });
};

exports.exists = function(bundleName, variableName) {
    if (!declaredVars.hasOwnProperty(bundleName))
        return false;

    return declaredVars[bundleName].hasOwnProperty(variableName);
};

exports.findOrDeclare = function(bundleName, variableName, initialVal) {
    var existingVar = this.find(bundleName, variableName);
    if (typeof(existingVar) !== 'undefined') {
        log.debug('Variable %s (%s) already existed:', variableName, bundleName, existingVar);
        return existingVar;
    }

    return this.declare(bundleName, variableName, initialVal);
};

exports.find = function(bundleName, variableName) {
    if (!declaredVars.hasOwnProperty(bundleName))
        return;

    if (!declaredVars[bundleName].hasOwnProperty(variableName))
        return;

    return declaredVars[bundleName][variableName];
};

exports.findByBundleName = function(bundleName) {
    return declaredVars.hasOwnProperty(bundleName)
        ? declaredVars[bundleName]
        : null;
};

exports.findByVariableName = function(variableName) {
    var foundVars = {};

    for (var bundleName in declaredVars) {
        if (declaredVars[bundleName].hasOwnProperty(variableName)) {
            foundVars[bundleName] = variableName;
        }
    }

    return foundVars;
};

exports.emitToAll = function(eventName, data) {
    // Emit to clients using Socket.IO
    io.emit(eventName, data);

    // Emit to extensions using EventEmitter
    this.emit(eventName, data);
};

module.exports = exports;
