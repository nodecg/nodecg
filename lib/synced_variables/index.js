'use strict';
var io = require(process.cwd() + '/server.js');
var log = require('../logger');
var util = require('util');
var events = require('events');
var declaredVars = {};

function SyncedVariables() {
    if ( SyncedVariables.prototype._singletonInstance ) {
        return SyncedVariables.prototype._singletonInstance;
    }
    SyncedVariables.prototype._singletonInstance = this;

    events.EventEmitter.call(this);

    var self = this;
    io.sockets.on('connection', function (socket) {
        socket.on('declareVariable', function (data, cb) {
            if (typeof cb === 'function')
                cb(self.findOrDeclare(data.bundleName, data.variableName, data.initialVal));
        });

        socket.on('assignVariable', function (data, cb) {
            if (typeof cb === 'function')
                cb(self.assign(data.bundleName, data.variableName, data.value));
        });

        socket.on('destroyVariable', function (data, cb) {
            if (typeof cb === 'function')
                cb(self.destroy(data.bundleName, data.variableName));
        });
    });
}

util.inherits(SyncedVariables, events.EventEmitter);

SyncedVariables.prototype.declare = function(bundleName, variableName, initialVal) {
    // Initialize the parent object if not present
    if (!declaredVars.hasOwnProperty(bundleName))
        declaredVars[bundleName] = {};

    declaredVars[bundleName][variableName] = initialVal;

    this.emitToAll('variableDeclared', {
        bundleName: bundleName,
        variableName: variableName,
        value: initialVal
    });
    log.debug("[lib/variables] Variable %s (%s) declared:", variableName, bundleName, initialVal);

    return initialVal;
};

SyncedVariables.prototype.destroy = function(bundleName, variableName) {
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

SyncedVariables.prototype.assign = function(bundleName, variableName, value) {
    if (!this.exists(bundleName, variableName)) {
        log.error("[lib/variables] Attempted to assign non-existant variable %s (%s)", variableName, bundleName)
    }

    declaredVars[bundleName][variableName] = value;
    log.debug("[lib/variables] Variable %s (%s) assigned: ", variableName, bundleName, value);
    this.emitToAll('variableAssigned', {
        bundleName: bundleName,
        variableName: variableName,
        value: value
    });
};

SyncedVariables.prototype.exists = function(bundleName, variableName) {
    if (!declaredVars.hasOwnProperty(bundleName))
        return false;

    return declaredVars[bundleName].hasOwnProperty(variableName);
};

SyncedVariables.prototype.findOrDeclare = function(bundleName, variableName, initialVal) {
    var existingVar = this.find(bundleName, variableName);
    if (typeof(existingVar) !== 'undefined') {
        log.debug("[lib/variables] Variable %s (%s) already existed:", variableName, bundleName, existingVar);
        return existingVar;
    }

    return this.declare(bundleName, variableName, initialVal);
};

SyncedVariables.prototype.find = function(bundleName, variableName) {
    if (!declaredVars.hasOwnProperty(bundleName))
        return;

    if (!declaredVars[bundleName].hasOwnProperty(variableName))
        return;

    return declaredVars[bundleName][variableName];
};

SyncedVariables.prototype.findByBundleName = function(bundleName) {
    return declaredVars.hasOwnProperty(bundleName)
        ? declaredVars[bundleName]
        : null;
};

SyncedVariables.prototype.findByVariableName = function(variableName) {
    var foundVars = {};

    for (var bundleName in declaredVars) {
        if (declaredVars[bundleName].hasOwnProperty(variableName)) {
            foundVars[bundleName] = variableName;
        }
    }

    return foundVars;
};

SyncedVariables.prototype.emitToAll = function(eventName, data) {
    // Emit to clients using Socket.IO
    io.sockets.emit(eventName, data);

    // Emit to extensions using EventEmitter
    this.emit(eventName, data);
};

module.exports = new SyncedVariables;
