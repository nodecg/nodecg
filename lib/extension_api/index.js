'use strict';

var syncedVariables = require('../synced_variables');
var io = {};
var path = require('path');
var server = require('../../server.js'); // ew gross TODO fix this
var log = require('../logger');
var config = require('../config').filteredConfig;

function NodeCG(bundleName, ioInstance) {
    this.bundleName = bundleName;
    this.variables = {};

    this._handlers = [];
    this._varHandlers = [];

    io = ioInstance;
    var self = this;

    io.sockets.on('connection', function onConnection(socket) {
        socket.on('message', function onMessage(data, cb) {
            var len = self._handlers.length;
            for (var i = 0; i < len; i++) {
                var handler = self._handlers[i];
                if (data.messageName === handler.messageName &&
                    data.bundleName === handler.bundleName) {
                    handler.func(data.content, cb);
                }
            }
        });
    });

    syncedVariables.on('variableDeclared', function variableDeclared(data) {
        // Don't really need this.
        // If an extension tries to declare an already existing var, it will just get a reference to the existing one
    });

    syncedVariables.on('variableAssigned', function variableAssigned(data) {
        // Invoke callbacks for this variable
        var len =  self._varHandlers.length;
        for (var i = 0; i < len; i++) {
            var handler = self._varHandlers[i];
            if (data.variableName === handler.variableName &&
                data.bundleName === handler.bundleName) {
                handler.func(data.value);
            }
        }
    });

    syncedVariables.on('variableDestroyed', function variableDestroyed(data) {
        // Remove callbacks for this variable
        var len =  self._varHandlers.length;
        for (var i = 0; i < len; i++) {
            var handler = self._varHandlers[i];
            if (data.variableName === handler.variableName &&
                data.bundleName === handler.bundleName) {
                self._varHandlers.splice(i, 1);
            }
        }

        if (self.variables.hasOwnProperty(data.variableName))
            delete self.variables[data.variableName]
    });

    var config = {};
    Object.defineProperty( this, 'config', {
        value: config,
        writable: false,
        enumerable: true
    });
}

NodeCG.prototype.sendMessage = function (messageName, data, callback) {
    if (typeof callback === "undefined" && typeof data === "function") {
        callback = data;
        data = null;
    }

    io.sockets.json.send({
        bundleName: this.bundleName,
        messageName: messageName,
        content: data
    }, callback);
};

NodeCG.prototype.listenFor = function (messageName, bundleName, handler) {
    if (typeof handler === "undefined") {
        handler = bundleName;
        bundleName = this.bundleName;
    }

    // Check if a handler already exists for this message
    var len =  this._handlers.length;
    for (var i = 0; i < len; i++) {
        var existingHandler = this._handlers[i];
        if (messageName === existingHandler.messageName &&
            bundleName === existingHandler.bundleName) {
            log.error("[lib/extension_api] %s attempted to declare a duplicate 'listenFor' handler:", this.bundleName, bundleName, messageName);
            return;
        }
    }

    this._handlers.push({
        messageName: messageName,
        bundleName: bundleName,
        func: handler
    });
};

NodeCG.prototype.declareSyncedVar = function (args) {
    var setter = args.setter || function(){};
    var name = args.variableName;
    var bundle = args.bundleName || this.bundleName;
    var value = args.initialVal;

    if (!name) {
        var msg = "[lib/extension_api] Attempted to declare an unnamed variable for bundle " + bundle;
        var e = new Error(msg);
        log.error(msg);
        throw e;
    }

    // Check if a handler already exists for this variable
    var len =  this._varHandlers.length;
    for (var i = 0; i < len; i++) {
        var existingHandler = this._varHandlers[i];
        if (name === existingHandler.variableName &&
            bundle === existingHandler.bundleName) {
            log.error("[lib/extension_api] %s attempted to declare a duplicate synced var:", this.bundleName, bundle, name);
            return;
        }
    }

    // Run the setter with the initial value, or the found value if the var already existed
    setter(syncedVariables.findOrDeclare(bundle, name, value));

    // Add the 'setter' callback to the array of handlers that will be invoked
    // when the value of this variable changes
    this._varHandlers.push({
        bundleName: bundle,
        variableName: name,
        func: setter
    });

    Object.defineProperty(this.variables, name, {
        get: function() {
            return syncedVariables.find(bundle, name);
        },
        set: function(newValue) {
            syncedVariables.assign(bundle, name, newValue);
        },
        enumerable: true
    });
};

NodeCG.prototype.destroySyncedVar = function (args) {
    var name = args.variableName;
    var bundle = args.bundleName || this.bundleName;

    if (!name) {
        var msg = "[lib/extension_api] Attempted to destroy an unnamed variable for bundle " + bundle;
        var e = new Error(msg);
        log.error(msg);
        throw e;
    }

    // Automatically invokes the 'variableDestroyed' listener in the constructor of NodeCG
    // which deleted the property from NodeCG.variables
    syncedVariables.destroy(bundle, name);
};

NodeCG.prototype.util = {};

NodeCG.prototype.util.authCheck = function (req, res, next) {
    if (!config.login.enabled) {
        return next();
    }

    var allowed = (req.user !== undefined) ? req.user.allowed : false;

    if (req.isAuthenticated() && allowed) {
        return next();
    }

    res.redirect('/login');
};

Object.defineProperty(NodeCG.prototype, 'extensions', {
    get: function() {
        return server.extensions;
    },
    enumerable: true
});

module.exports = NodeCG;
