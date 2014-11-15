'use strict';

var syncedVariables = require('../synced_variables');
var varHandlers = [];
var io = {};
var path = require('path');
var server = require('../../server.js'); // ew gross TODO fix this

function NodeCG(bundleName, ioInstance) {
    this.bundleName = bundleName;
    this.variables = {};

    this._handlers = [];

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
        var len =  varHandlers.length;
        for (var i = 0; i < len; i++) {
            var handler = varHandlers[i];
            if (data.variableName === handler.variableName &&
                data.bundleName === handler.bundleName) {
                handler.func(data.value);
            }
        }
    });

    syncedVariables.on('variableDestroyed', function variableDestroyed(data) {
        // Remove callbacks for this variable
        var len =  varHandlers.length;
        for (var i = 0; i < len; i++) {
            var handler = varHandlers[i];
            if (data.variableName === handler.variableName &&
                data.bundleName === handler.bundleName) {
                varHandlers.splice(i, 1);
            }
        }

        if (self.variables.hasOwnProperty(data.variableName))
            delete self.variables[data.variableName]
    });

    var config = {};
    Object.defineProperty( this, 'config', {
        value: require('../config'),
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

    this._handlers.push({
        messageName: messageName,
        bundleName: bundleName,
        func: handler
    });
};

NodeCG.prototype.declareSyncedVar = function (name, value, setter) {
    if (typeof setter === "undefined") {
        if (typeof value === "function") {
            setter = value;
            value = null;
        } else {
            setter = function(){};
        }
    }

    // Run the setter with the initial value, or the found value if the var already existed
    setter(syncedVariables.findOrDeclare(this.bundleName, name, value));

    // Add the 'setter' callback to the array of handlers that will be invoked
    // when the value of this variable changes
    varHandlers.push({
        bundleName: this.bundleName,
        variableName: name,
        func: setter
    });
    
    var nodecg = this;
    Object.defineProperty(this.variables, name, {
        get: function() {
            return syncedVariables.find(nodecg.bundleName, name);
        },
        set: function(newValue) {
            syncedVariables.assign(nodecg.bundleName, name, newValue);
        },
        enumerable: true
    });
};

NodeCG.prototype.destroySyncedVar = function (name) {
    // Automatically invokes the 'variableDestroyed' listener in the constructor of NodeCG
    // which deleted the property from NodeCG.variables
    syncedVariables.destroy(this.bundleName, name);
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
