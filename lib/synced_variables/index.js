var io = {};
var log = require('../logger');
var declaredVars = {};

function SyncedVariables(ioInstance) {
    if ( SyncedVariables.prototype._singletonInstance ) {
        return SyncedVariables.prototype._singletonInstance;
    }
    SyncedVariables.prototype._singletonInstance = this;

    io = ioInstance;

    var self = this;
    io.sockets.on('connection', function (socket) {
        socket.on('declareVariable', function (data, cb) {
            cb(self.findOrDeclare(data.bundleName, data.variableName, data.initialVal));
        });

        socket.on('assignVariable', function (data, cb) {
            cb(self.assign(data.bundleName, data.variableName, data.value));
        });
    });
}

SyncedVariables.prototype.findOrDeclare = function(bundleName, variableName, initialVal) {
    var existingVar = this.find(bundleName, variableName);
    if (existingVar) {
        return existingVar;
    }

    return this.declare(bundleName, variableName, initialVal);
};

SyncedVariables.prototype.declare = function(bundleName, variableName, initialVal) {
    // Initialize the parent object if not present
    if (!declaredVars.hasOwnProperty[bundleName])
        declaredVars[bundleName] = {};

    declaredVars[bundleName][variableName] = initialVal;

    io.emit('variableDeclared', {
        bundleName: bundleName,
        variableName: variableName,
        value: initialVal
    });
    log.debug("[lib/variables] Variable %s (%s) declared:", variableName, bundleName, initialVal);

    return initialVal;
};

SyncedVariables.prototype.destroy = function(bundleName, variableName) {
    if (declaredVars.hasOwnProperty[bundleName]) {
        // Delete the variable from the bundle, if it exists
        if (declaredVars[bundleName].hasOwnProperty(variableName)) {
            delete declaredVars[bundleName][variableName];
            io.emit('variableDestroyed', {
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

    log.debug("[lib/variables] Variable %s (%s) assigned: ", variableName, bundleName, value);
    io.emit('variableAssigned', {
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

SyncedVariables.prototype.find = function(bundleName, variableName) {
    if (!declaredVars.hasOwnProperty(bundleName))
        return null;

    if (!declaredVars[bundleName].hasOwnProperty(variableName))
        return null;

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

module.exports = function(io) { new SyncedVariables(io) };
