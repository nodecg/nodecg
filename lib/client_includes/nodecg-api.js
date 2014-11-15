function NodeCG(bundlename, config) {
    'use strict';

    Object.defineProperty(this, 'config', {
        value: config,
        writable: false,
        enumerable: true
    });

    /**
     * Provided for compatibility
     * REMOVE: 0.2.x
     */
    this.host = this.config.host;
    this.port = this.config.port;

    // We can't guarantee Socket.io is ready in time on the view, so empty object for now
    this._socket = {};

    this._handlers = [];
    this._varHandlers = [];
    this._declaredVars = {};

    var self = this;

    // Called internally once we know Socket.io is ready
    this._setupAPI = function() {
        self._socket = io.connect('http://'+ self.config.host +':'+ self.config.port +'/');

        self._socket.on('message', function (data, cb) {
            var len = self._handlers.length;
            for (var i = 0; i < len; i++) {
                var _handler = self._handlers[i];
                if (data.messageName === _handler.messageName &&
                    data.bundleName === _handler.bundleName) {
                    _handler.func(data.content, cb);
                }
            }
        });

        self.sendMessage = function (messageName, data, callback) {
            if (typeof callback === "undefined" && typeof data === "function") {
                callback = data;
                data = null;
            }

            self._socket.emit('message', {
                bundleName: bundlename,
                messageName: messageName,
                content: data
            }, callback);
        };

        self.listenFor = function (messageName, bundleName, handler) {
            if (typeof handler === "undefined") {
                handler = bundleName;
                bundleName = bundlename;
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
                delete self.variables[data.variableName]
        });

        self.declareSyncedVar = function (name, value, setter) {
            if (typeof setter === "undefined") {
                if (typeof value === "function") {
                    setter = value;
                    value = null;
                } else {
                    setter = function(){};
                }
            }

            self._socket.emit('declareVariable', {
                bundleName: bundlename,
                variableName: name,
                initialVal: value
            }, variableDeclared);

            function variableDeclared(value) {
                // Run the setter with the initial value, or the found value if the var already existed
                setter(value);

                // Add the 'setter' callback to the array of handlers that will be invoked
                // when the value of this variable changes
                self._varHandlers.push({
                    bundleName: bundlename,
                    variableName: name,
                    func: setter
                });

                Object.defineProperty(self.variables, name, {
                    get: function() {
                        return self._declaredVars[name];
                    },
                    set: function(newValue) {
                        self._socket.emit('assignVariable', {
                            bundleName: bundlename,
                            variableName: name,
                            value: newValue
                        });
                    },
                    enumerable: true
                });
            }
        };

        // not implemented, need to make a way to delete listenFor handlers
        /*self.deleteVar = function (name) {
            delete this.variables[name];
        };*/

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
