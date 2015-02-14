/* jshint unused:false */

/**
 * Creates a new NodeCG client API instance.
 * @constructor
 * @param {string} bundlename   The name of the bundle.
 * @param {object} bundleConfig The bundle's config.
 * @param {object} ncgConfig    The global NodeCG config.
 * @param {object} socket       A Socket.IO socket instance.
 */
function NodeCG(bundlename, bundleConfig, ncgConfig, socket) {
    'use strict';

    // This constructor only works if socket.io is loaded
    if (typeof io === 'undefined') {
        throw new Error('[nodeceg] Socket.IO must be loaded before instantiating the API');
    }

    // If title isn't set, set it to the bundle name
    if (document.title === '') document.title = bundlename;

    // Make socket accessible to public methods
    this._socket = socket;

    // Create read-only config property, which contains the current filtered NodeCG config
    Object.defineProperty(this, 'config', {
        value: ncgConfig,
        writable: false,
        enumerable: true
    });
    Object.freeze(this.config);

    // Make bundle name and config publicly accessible
    this.bundleName = bundlename;
    this.bundleConfig = bundleConfig;

    // Initialize internal data structures and make them accessible to public methods
    this._handlers = [];
    this._varHandlers = [];
    this._declaredVars = {};

    var self = this;

    // ###Socket events
    socket

        // Upon receiving a message, execute any handlers for it
        .on('message', function onMessage(data) {
            var len = self._handlers.length;
            for (var i = 0; i < len; i++) {
                var handler = self._handlers[i];
                if (data.messageName === handler.messageName &&
                    data.bundleName === handler.bundleName) {
                    handler.func(data.content);
                }
            }
        })

        // After a reconnect, throw away and re-declare all syncedVars.
        // This ensures that there is not a state mismatch with the server.
        .on('reconnect', function onReconnect() {
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
        })

        // This event is currently unused.
        .on('variableDeclared', function variableDeclared(data) {})

        // When the value of a syncedVar is changed, invoke 'setters' for it with the new value
        .on('variableAssigned', function variableAssigned(data) {
            if (self._declaredVars.hasOwnProperty(data.variableName))
                self._declaredVars[data.variableName] = data.value;

            var len =  self._varHandlers.length;
            for (var i = 0; i < len; i++) {
                var _handler = self._varHandlers[i];
                if (data.variableName === _handler.variableName &&
                    data.bundleName === _handler.bundleName) {
                    _handler.func(data.value);
                }
            }
        })

        // When a syncedVar is destroyed, remove its handlers and the property from `nodecg.variables`
        .on('variableDestroyed', function variableDestroyed(data) {
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
        })

        // Completely drops all trace of all syncedVariables
        // Only used in automated tests.
        .on('variablesReset', function variablesReset() {
            self._handlers = [];
            self._varHandlers = [];
            self._declaredVars = {};
            self.variables = {};
        });

    //
    this.variables = {};
}

// ###NodeCG prototype

/**
 * Sends a message within the current bundle.
 * @param {string}   messageName The name of the message.
 * @param {Mixed}    [data]      The data to send.
 * @param {function} callback    The callback fired when this message has been acknowledged by the server.
 */
NodeCG.prototype.sendMessage = function(messageName, data, callback) {
    'use strict';

    this.sendMessageToBundle(messageName, this.bundleName, data, callback);
};

/**
 * Sends a message to a specific bundle.
 * @param {string}   messageName The name of the message.
 * @param {string}   bundleName  The name of the target bundle.
 * @param {Mixed}    [data]      The data to send
 * @param {function} callback    The callback fired when this message has been acknowledged by the server.
 */
NodeCG.prototype.sendMessageToBundle = function (messageName, bundleName, data, callback) {
    'use strict';

    if (typeof callback === 'undefined' && typeof data === 'function') {
        callback = data;
        data = null;
    }

    this._socket.emit('message', {
        bundleName: bundleName,
        messageName: messageName,
        content: data
    }, callback);
};

/**
 * Listens for a message.
 * @param {string}   messageName                     The name of the message.
 * @param {string}   [bundleName=CURRENT_BUNDLE_NAME] The bundle namespace to in which to listen for this message
 * @param {function} handler                          The callback fired when this message is received.
 */
NodeCG.prototype.listenFor = function (messageName, bundleName, handler) {
    'use strict';

    if (typeof handler === 'undefined') {
        handler = bundleName;
        bundleName = this.bundleName;
    }

    // Check if a handler already exists for this message
    var len = this._handlers.length;
    for (var i = 0; i < len; i++) {
        var existingHandler = this._handlers[i];
        if (messageName === existingHandler.messageName &&
            bundleName === existingHandler.bundleName) {
            console.error('[nodecg-api] %s attempted to declare a duplicate listenFor handler:',
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
 * @param {object} args                                  The arguments object.
 * @param {string} args.name                             The name of the synced variable.
 * @param {string} [args.bundleName=CURRENT_BUNDLE_NAME] The bundle namespace in which to create this variable.
 * @param {string} [args.setter]                         The callback to be fired when this variable changes.
 * @param {string} [args.value]                          The value that this variable should be initialized to.
 */
NodeCG.prototype.declareSyncedVar = function (args) {
    'use strict';

    var setter = args.setter || function(){};
    var name = args.name || args.variableName;
    var bundle = args.bundleName || this.bundleName;
    var value = args.initialVal || args.initialValue;

    var self = this;

    if (!name) {
        var msg = '[nodecg-api] Attempted to declare an unnamed variable for bundle ' + bundle;
        var e = new Error(msg);
        console.log(e);
        throw e;
    }

    this._socket.emit('declareVariable', {
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
                    self.bundleName, bundle, name);
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

/**
 * Reads the value of a synchronized variable without creating a subscription to it.
 * @param {string}   name                         The name of the variable.
 * @param {string}   [bundle=CURRENT_BUNDLE_NAME] The bundle namespace to in which to look for this variable
 * @param {function} cb                           The callback fired when this message is received.
 */
NodeCG.prototype.readSyncedVar = function(name, bundle, cb) {
    'use strict';

    if (typeof cb === 'undefined') {
        cb = bundle;
        bundle = this.bundleName;
    }

    this._socket.emit('readVariable', {
        bundleName: bundle,
        variableName: name
    }, cb);
};

/**
 * Destroys a synchronized variable, and causes it to be removed from all API instances.
 * @param {object} args            The arguments object.
 * @param {string} args.name       The name of the synced variable to destroy.
 * @param {string} args.bundleName The bundle namespace in which to destroy this variable.
 */
NodeCG.prototype.destroySyncedVar = function (args) {
    'use strict';

    var name = args.variableName;
    var bundle = args.bundleName || this.bundleName;

    if (!name) {
        var msg = '[nodecg-api] Attempted to destroy an unnamed variable for bundle ' + bundle;
        var e = new Error(msg);
        console.error(msg);
        throw e;
    }

    // Automatically invokes the 'variableDestroyed' listener in the constructor of NodeCG
    // which deleted the property from NodeCG.variables
    this._socket.emit('destroyVariable', {
        bundleName: bundle,
        variableName: name
    });
};
