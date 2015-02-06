'use strict';

var syncedVariables = require('../synced_variables');
var io = {};
var server = require('../server');
var log = require('../logger')('nodecg/lib/extension_api');
var filteredConfig = require('../config').getFilteredConfig();
var utils = require('../util');

/**
 * Creates a new NodeCG extension API instance.
 * @constructor
 * @param {object} bundle - The bundle object to build an API instance from.
 */
function NodeCG(bundle) {
    this.bundleName = bundle.name;
    this.bundleConfig = bundle.config;

    this.log = require('../logger')('extension/' + bundle.name);

    this.variables = {};

    this._handlers = [];
    this._varHandlers = [];

    io = server.getIO();
    var self = this;

    io.on('connection', function onConnection(socket) {
        socket.on('message', function onMessage(data, cb) {
            log.trace('[%s] Socket %s sent a message (callback: %s):', self.bundleName, socket.id, data, Boolean(cb));
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

    // Don't really need this.
    // If an extension tries to declare an already existing var, it will just get a reference to the existing one
    /*syncedVariables.on('variableDeclared', function variableDeclared(data) {
        // Do stuff
    });*/

    syncedVariables.on('variableAssigned', function variableAssigned(data) {
        log.trace('[%s] Variable assigned:', self.bundleName, data);
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
        log.trace('[%s] Variable destroyed:', self.bundleName, data);
        // Remove callbacks for this variable
        var len =  self._varHandlers.length;
        for (var i = 0; i < len; i++) {
            var handler = self._varHandlers[i];
            if (data.variableName === handler.variableName &&
                data.bundleName === handler.bundleName) {
                self._varHandlers.splice(i, 1);
            }
        }

        if (self.variables.hasOwnProperty(data.variableName)) {
            delete self.variables[data.variableName];
        }
    });

    syncedVariables.on('variablesReset', function variablesReset() {
        // Drops all variables
        self.variables = {};
        self._handlers = [];
        self._varHandlers = [];
        self.variables = {};
    });

    Object.defineProperty(this, 'config', {
        value: filteredConfig,
        writable: false,
        enumerable: true
    });
    Object.freeze(this.config);
}

/**
 * Sends a message within the current bundle.
 * @param {string} messageName - The name of the message.
 * @param {*=} data - The data to send.
 */
NodeCG.prototype.sendMessage = function (messageName, data) {
    this.sendMessageToBundle(messageName, this.bundleName, data);
};

/**
 * Sends a message to a specific bundle.
 * @param {string} messageName - The name of the message.
 * @param {string} bundleName - The name of the target bundle.
 * @param {*=} data - The data to send.
 */
NodeCG.prototype.sendMessageToBundle = function (messageName, bundleName, data) {
    log.trace('[%s] Sending message %s to bundle %s with data:',
        this.bundleName, messageName, bundleName, data);
    io.emit('message', {
        bundleName: bundleName,
        messageName: messageName,
        content: data
    });
};

/**
 * Listens for a message.
 * @param {string} messageName - The name of the message.
 * @param {string} [bundleName=The current bundle name] - The bundle namespace to in which to listen for this message
 * @param {messageCallback} handler - The callback fired when this message is received.
 */
NodeCG.prototype.listenFor = function (messageName, bundleName, handler) {
    if (typeof handler === 'undefined') {
        handler = bundleName;
        bundleName = this.bundleName;
    }

    log.trace('[%s] Listening for %s from bundle %s', this.bundleName, messageName, bundleName);

    // Check if a handler already exists for this message
    var len =  this._handlers.length;
    for (var i = 0; i < len; i++) {
        var existingHandler = this._handlers[i];
        if (messageName === existingHandler.messageName && bundleName === existingHandler.bundleName) {
            log.error('%s attempted to declare a duplicate "listenFor" handler:',
                this.bundleName, bundleName, messageName);
            return;
        }
    }

    this._handlers.push({
        messageName: messageName,
        bundleName: bundleName,
        func: handler
    });
};

/**
 * Declares a synchronized variable. If the given variable name/bundle pair already exists, uses that.
 * @param {object} args - The arguments object.
 */
NodeCG.prototype.declareSyncedVar = function (args) {
    var setter = args.setter || function(){};
    var name = args.name || args.variableName;
    var bundle = args.bundleName || this.bundleName;
    var value = args.initialValue || args.initialVal;

    log.trace('[%s] Variable %s declared for bundle %s with value %s', this.bundleName, name, bundle, value);

    if (!name) {
        var msg = 'Attempted to declare an unnamed variable for bundle ' + bundle;
        var e = new Error(msg);
        log.error(msg);
        throw e;
    }

    // Check if a handler already exists for this variable
    var len =  this._varHandlers.length;
    for (var i = 0; i < len; i++) {
        var existingHandler = this._varHandlers[i];
        if (name === existingHandler.variableName && bundle === existingHandler.bundleName) {
            log.error('%s attempted to declare a duplicate synced var:', this.bundleName, bundle, name);
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

/**
 * Reads the value of a synchronized variable without creating a subscription to it.
 * @param {string} name - The name of the variable.
 * @param {string} [bundle=The current bundle name] - The bundle namespace to in which to look for this variable
 */
NodeCG.prototype.readSyncedVar = function(name, bundle) {
    bundle = bundle || this.bundleName;
    return syncedVariables.find(bundle, name);
};

/**
 * Destroys a synchronized variable, and causes it to be removed from all API instances.
 * @param {object} args - The arguments object.
 */
NodeCG.prototype.destroySyncedVar = function (args) {
    var name = args.variableName;
    var bundle = args.bundleName || this.bundleName;

    if (!name) {
        var msg = 'Attempted to destroy an unnamed variable for bundle ' + bundle;
        var e = new Error(msg);
        log.error(msg);
        throw e;
    }

    // Automatically invokes the 'variableDestroyed' listener in the constructor of NodeCG
    // which deleted the property from NodeCG.variables
    syncedVariables.destroy(bundle, name);
};

NodeCG.prototype.util = {};

NodeCG.prototype.util.authCheck = utils.authCheck;

NodeCG.prototype.util.findSession = utils.findSession;

Object.defineProperty(NodeCG.prototype, 'extensions', {
    get: function() {
        return server.getExtensions();
    },
    enumerable: true
});

module.exports = NodeCG;

/**
 * This callback type is called `messageCallback` and is displayed as a global symbol.
 *
 * @callback messageCallback
 * @param {*} data - The data returned.
 */