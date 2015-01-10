function NodeCG(bundlename, bundleConfig, ncgConfig) {
    'use strict';

    Object.defineProperty(this, 'config', {
        value: ncgConfig,
        writable: false,
        enumerable: true
    });
    Object.freeze(this.config);

    /**
     * Provided for compatibility
     * REMOVE: 0.2.x
     */
    this.host = this.config.host;
    this.port = this.config.port;

    this.bundleConfig = bundleConfig;

    // We can't guarantee Socket.io is ready in time on the view, so empty object for now
    this._socket = {};

    this._handlers = [];
    this._varHandlers = [];
    this._declaredVars = {};

    var self = this;

    // Called internally once we know Socket.io is ready
    this._setupAPI = function() {
        self._socket = io('http://'+ self.config.host +':'+ self.config.port +'/');

        self._socket.on('message', function onMessage(data) {
            var len = self._handlers.length;
            for (var i = 0; i < len; i++) {
                var _handler = self._handlers[i];
                if (data.messageName === _handler.messageName &&
                    data.bundleName === _handler.bundleName) {
                    _handler.func(data.content);
                }
            }
        });

        self.sendMessage = function(messageName, data, callback) {
            self.sendMessageToBundle(messageName, bundlename, data, callback);
        };

        self.sendMessageToBundle = function (messageName, bundleName, data, callback) {
            if (typeof callback === "undefined" && typeof data === "function") {
                callback = data;
                data = null;
            }

            self._socket.emit('message', {
                bundleName: bundleName,
                messageName: messageName,
                content: data
            }, callback);
        };

        self.listenFor = function (messageName, bundleName, handler) {
            if (typeof handler === "undefined") {
                handler = bundleName;
                bundleName = bundlename;
            }

            // Check if a handler already exists for this message
            var len = self._handlers.length;
            for (var i = 0; i < len; i++) {
                var existingHandler = self._handlers[i];
                if (messageName === existingHandler.messageName &&
                    bundleName === existingHandler.bundleName) {
                    console.error("[nodecg-api] %s attempted to declare a duplicate 'listenFor' handler:", bundlename, bundleName, messageName);
                    return;
                }
            }

            self._handlers.push({
                messageName: messageName,
                bundleName: bundleName,
                func: handler
            });
        };

        self._socket.on('variableDeclared', function variableDeclared(data) {
            // Don't really need this.
            // If a bundle tries to declare an already existing var, it will just get a reference to the existing one
        });

        self._socket.on('variableAssigned', function variableAssigned(data) {
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

        self._socket.on('variableDestroyed', function variableDestroyed(data) {
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

        self.declareSyncedVar = function (args) {
            var setter = args.setter || function(){};
            var name = args.name || args.variableName;
            var bundle = args.bundleName || bundlename;
            var value = args.initialVal;

            if (!name) {
                var msg = "[nodecg-api] Attempted to declare an unnamed variable for bundle " + bundle;
                var e = new Error(msg);
                console.error(msg);
                throw e;
            }

            self._socket.emit('declareVariable', {
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
                        console.error("[nodecg-api] %s attempted to declare a duplicate synced var:", bundlename, bundle, name);
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
                        self._socket.emit('assignVariable', {
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

        self.destroySyncedVar = function (args) {
            var name = args.variableName;
            var bundle = args.bundleName || bundlename;

            if (!name) {
                var msg = "[nodecg-api] Attempted to destroy an unnamed variable for bundle " + bundle;
                var e = new Error(msg);
                console.error(msg);
                throw e;
            }

            // Automatically invokes the 'variableDestroyed' listener in the constructor of NodeCG
            // which deleted the property from NodeCG.variables
            self._socket.emit('destroyVariable', {
                bundleName: bundle,
                variableName: name
            });
        };

        self.variables = {};
    };

    // On the dashboard, Socket.io is defined so setup now
    // viewsetup.ejs will call when ready
    if (typeof io !== "undefined") {
        this._setupAPI();
    }

    // For use by views, never called on dashboard
    this.onready = function() {};
}
