/* jshint unused:false */

/**
 * Creates a new NodeCG client API instance.
 * @constructor
 * @param {string} bundlename - The name of the bundle.
 * @param {object} bundleConfig - The bundle's config.
 * @param {object} ncgConfig - The global NodeCG config.
 * @param {object} socket - A Socket.IO socket instance.
 */
function NodeCG(bundlename, bundleConfig, ncgConfig, socket) {
    'use strict';

    // This constructor only works if socket.io is loaded
    if (typeof io === 'undefined') {
        throw new Error('[nodeceg] Socket.IO must be loaded before instantiating the API');
    }

    // If title isn't set, set it to the bundle name
    if (document.title === '') document.title = bundlename;

    Object.defineProperty(this, 'config', {
        value: ncgConfig,
        writable: false,
        enumerable: true
    });
    Object.freeze(this.config);

    this.bundleConfig = bundleConfig;
    this._handlers = [];
    this._varHandlers = [];
    this._declaredVars = {};

    var self = this;

    socket.on('message', function onMessage(data) {
        var len = self._handlers.length;
        for (var i = 0; i < len; i++) {
            var _handler = self._handlers[i];
            if (data.messageName === _handler.messageName &&
                data.bundleName === _handler.bundleName) {
                _handler.func(data.content);
            }
        }
    });

    socket.on('reconnect', function onReconnect() {
        var oldVars = self._declaredVars;
        var oldVarHandlers = self._varHandlers;
        self._declaredVars = [];
        self._varHandlers = [];
        self.variables = {};

        oldVarHandlers.forEach(function (handler) {
            self.declareSyncedVar({
                name: handler.variableName,
                bundleName: handler.bundleName,
                initialValue: oldVars[handler.variableName],
                setter: handler.func
            });
        });
    });

    /**
     * Sends a message within the current bundle.
     * @param {string} messageName - The name of the message.
     * @param {*=} data - The data to send.
     * @param {messageCallback} callback - The callback fired when this message is received.
     */
    self.sendMessage = function(messageName, data, callback) {
        self.sendMessageToBundle(messageName, bundlename, data, callback);
    };

    /**
     * Sends a message to a specific bundle.
     * @param {string} messageName - The name of the message.
     * @param {string} bundleName - The name of the target bundle.
     * @param {*=} data - The data to send.
     * @param {messageCallback} callback - The callback fired when this message is received.
     */
    self.sendMessageToBundle = function (messageName, bundleName, data, callback) {
        if (typeof callback === 'undefined' && typeof data === 'function') {
            callback = data;
            data = null;
        }

        socket.emit('message', {
            bundleName: bundleName,
            messageName: messageName,
            content: data
        }, callback);
    };

    /**
     * Listens for a message.
     * @param {string} messageName - The name of the message.
     * @param {string} [bundleName=The current bundle name] - The bundle namespace to in which to listen for this message
     * @param {messageCallback} handler - The callback fired when this message is received.
     */
    self.listenFor = function (messageName, bundleName, handler) {
        if (typeof handler === 'undefined') {
            handler = bundleName;
            bundleName = bundlename;
        }

        // Check if a handler already exists for this message
        var len = self._handlers.length;
        for (var i = 0; i < len; i++) {
            var existingHandler = self._handlers[i];
            if (messageName === existingHandler.messageName &&
                bundleName === existingHandler.bundleName) {
                console.error('[nodecg-api] %s attempted to declare a duplicate listenFor handler:',
                    bundlename, bundleName, messageName);
                return;
            }
        }

        self._handlers.push({
            messageName: messageName,
            bundleName: bundleName,
            func: handler
        });
    };

    socket.on('variableDeclared', function variableDeclared(data) {
        // Don't really need this.
        // If a bundle tries to declare an already existing var, it will just get a reference to the existing one
    });

    socket.on('variableAssigned', function variableAssigned(data) {
        if (self._declaredVars.hasOwnProperty(data.variableName))
            self._declaredVars[data.variableName] = data.value;

        // Invoke callbacks for this variable
        var len =  self._varHandlers.length;
        for (var i = 0; i < len; i++) {
            var _handler = self._varHandlers[i];
            if (data.variableName === _handler.variableName &&
                data.bundleName === _handler.bundleName) {
                _handler.func(data.value);
            }
        }
    });

    socket.on('variableDestroyed', function variableDestroyed(data) {
        // Remove callbacks for this variable
        var len =  self._varHandlers.length;
        for (var i = 0; i < len; i++) {
            var _handler = self._varHandlers[i];
            if (data.variableName === _handler.variableName &&
                data.bundleName === _handler.bundleName) {
                self._varHandlers.splice(i, 1);
            }
        }

        if (self.variables.hasOwnProperty(data.variableName))
            delete self.variables[data.variableName];
    });

    socket.on('variablesReset', function variablesReset() {
        // Drops all variables
        self._handlers = [];
        self._varHandlers = [];
        self._declaredVars = {};
        self.variables = {};
    });

    /**
     * Declares a synchronized variable. If the given variable name/bundle pair already exists, uses that.
     * @param {object} args - The arguments object.
     */
    self.declareSyncedVar = function (args) {
        var setter = args.setter || function(){};
        var name = args.name || args.variableName;
        var bundle = args.bundleName || bundlename;
        var value = args.initialVal || args.initialValue;

        if (!name) {
            var msg = '[nodecg-api] Attempted to declare an unnamed variable for bundle ' + bundle;
            var e = new Error(msg);
            console.log(e);
            throw e;
        }

        socket.emit('declareVariable', {
            bundleName: bundle,
            variableName: name,
            initialVal: value
        }, variableDeclared);

        function variableDeclared(value) {
            // Check if a handler already exists for this variable
            var len =  self._varHandlers.length;
            for (var i = 0; i < len; i++) {
                var existingHandler = self._varHandlers[i];
                if (name === existingHandler.variableName &&
                    bundle === existingHandler.bundleName) {
                    console.error('[nodecg-api] %s attempted to declare a duplicate synced var:',
                        bundlename, bundle, name);
                    return;
                }
            }

            // Cache it so the getter can function with no delay
            self._declaredVars[name] = value;

            // Add the 'setter' callback to the array of handlers that will be invoked
            // when the value of this variable changes
            self._varHandlers.push({
                bundleName: bundle,
                variableName: name,
                func: setter
            });

            Object.defineProperty(self.variables, name, {
                get: function() {
                    return self._declaredVars[name];
                },
                set: function(newValue) {
                    socket.emit('assignVariable', {
                        bundleName: bundle,
                        variableName: name,
                        value: newValue
                    });
                },
                enumerable: true
            });

            // Run the setter with the initial value, or the found value if the var already existed
            setter(value);
        }
    };

    /**
     * Reads the value of a synchronized variable without creating a subscription to it.
     * @param {string} name - The name of the variable.
     * @param {string} [bundle=The current bundle name] - The bundle namespace to in which to look for this variable
     * @param {readSyncedVarCallback} cb - The callback fired when this message is received.
     */
    self.readSyncedVar = function(name, bundle, cb) {
        if (typeof cb === 'undefined') {
            cb = bundle;
            bundle = bundlename;
        }

        socket.emit('readVariable', {
            bundleName: bundle,
            variableName: name
        }, cb);
    };

    /**
     * Destroys a synchronized variable, and causes it to be removed from all API instances.
     * @param {object} args - The arguments object.
     */
    self.destroySyncedVar = function (args) {
        var name = args.variableName;
        var bundle = args.bundleName || bundlename;

        if (!name) {
            var msg = '[nodecg-api] Attempted to destroy an unnamed variable for bundle ' + bundle;
            var e = new Error(msg);
            console.error(msg);
            throw e;
        }

        // Automatically invokes the 'variableDestroyed' listener in the constructor of NodeCG
        // which deleted the property from NodeCG.variables
        socket.emit('destroyVariable', {
            bundleName: bundle,
            variableName: name
        });
    };

    self.variables = {};
}

/**
 * This callback type is called `messageCallback` and is displayed as a global symbol.
 *
 * @callback messageCallback
 * @param {*} data - The data returned.
 */

/**
 * This callback type is called `messageCallback` and is displayed as a global symbol.
 *
 * @callback readSyncedVarCallback
 * @param {*} value - The current value of the syncedVar.
 */
