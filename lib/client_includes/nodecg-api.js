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
    this._messageHandlers = [];
    this._varChangeHandlers = [];
    this.variables = {};

    var self = this;

    /* global Nested, objectPath */
    // Generate a minimal record of changes from the changes reported by Object.observe
    this.observeVariables = function() {
        Nested.observe(self.variables, onChangeObserved);
    };

    function onChangeObserved(changes) {
        var formattedChanges = [];
        var roots = [];

        try {
            changes.forEach(function(change) {
                var path = change.path.substring(1).replace('/','.');
                var root = path.split('.')[0];

                if (roots.indexOf(root) < 0) {
                    roots.push(root);
                }

                var newVal = objectPath.get(change.root, path);
                switch(change.type) {
                    case 'add':
                        formattedChanges.push({
                            type: 'add',
                            path: path,
                            root: root,
                            newValue: newVal
                        });
                        break;
                    case 'update':
                        formattedChanges.push({
                            type: 'update',
                            path: path,
                            root: root,
                            oldValue: change.oldValue,
                            newValue: newVal
                        });
                        break;
                    case 'delete':
                        formattedChanges.push({
                            type: 'delete',
                            path: path,
                            root: root,
                            oldValue: change.oldValue
                        });
                        break;
                    default:
                        formattedChanges.push({
                            type: 'other',
                            root: root,
                            path: path
                        });
                }
            });

            self._socket.emit('changeVariable', {
                bundleName: self.bundleName,
                changes: formattedChanges,
                roots: roots
            });
        } catch (e) {
            console.error(e);
        }
    }

    this.unobserveVariables = function() {
        if (!self.variables) return;
        Nested.unobserve(self.variables, onChangeObserved);
    };

    this.observeVariables();

    // ###Socket events
    socket

        // Upon receiving a message, execute any handlers for it
        .on('message', function onMessage(data) {
            var len = self._messageHandlers.length;
            for (var i = 0; i < len; i++) {
                var handler = self._messageHandlers[i];
                if (data.messageName === handler.messageName &&
                    data.bundleName === handler.bundleName) {
                    handler.func(data.content);
                }
            }
        })

        // After a reconnect, throw away and re-declare all syncedVars.
        // This ensures that there is not a state mismatch with the server.
        .on('reconnect', function onReconnect() {
            self.unobserveVariables();
            var oldVars = self.variables;
            var oldVarHandlers = self._varChangeHandlers;
            self._varChangeHandlers = [];
            self.variables = {};
            self.observeVariables();

            oldVarHandlers.forEach(function (handler) {
                self.declareSyncedVar({
                    name: handler.variableName,
                    bundleName: handler.bundleName,
                    initialValue: oldVars[handler.variableName],
                    setter: handler.func
                });
            });
        })

        .on('variableChanged', function variableChanged(data) {
            if (!self.variables.hasOwnProperty(data.variableName)) return;

            data.changes.forEach(function(change) {
                switch(change.type) {
                    case 'add':
                    case 'update':
                        // Set the new value
                        self.unobserveVariables();
                        objectPath.set(self.variables, change.path, change.newValue);
                        self.observeVariables();

                        // Invoke the onChange handler
                        var len =  self._varChangeHandlers.length;
                        for (var i = 0; i < len; i++) {
                            var _changeHandler = self._varChangeHandlers[i];
                            if (data.variableName === _changeHandler.variableName &&
                                data.bundleName === _changeHandler.bundleName) {

                                if (_changeHandler.type === 'setter') {
                                    _changeHandler.func(change.newValue);
                                } else if (_changeHandler.type === 'onChange') {
                                    _changeHandler.func(change.oldValue, change.newValue, change);
                                }
                            }
                        }
                        break;
                    case 'delete':
                        self.unobserveVariables();
                        objectPath.del(self.variables, change.path);
                        self.observeVariables();
                        // invoke delete handler
                        break;
                }
            });
        })

        // This event is currently unused.
        .on('variableDeclared', function variableDeclared(data) {})

        // When a syncedVar is destroyed, remove its handlers and the property from `nodecg.variables`
        .on('variableDestroyed', function variableDestroyed(data) {
            var len =  self._varChangeHandlers.length;
            for (var i = 0; i < len; i++) {
                var _handler = self._varChangeHandlers[i];
                if (data.variableName === _handler.variableName &&
                    data.bundleName === _handler.bundleName) {
                    self._varChangeHandlers.splice(i, 1);
                }
            }

            if (self.variables.hasOwnProperty(data.variableName))
                delete self.variables[data.variableName];
        })

        // Completely drops all trace of all syncedVariables
        // Only used in automated tests.
        .on('variablesReset', function variablesReset() {
            self._messageHandlers = [];
            self._varChangeHandlers = [];
            self.unobserveVariables();
            self.variables = {};
            self.observeVariables();
        });
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
    var len = this._messageHandlers.length;
    for (var i = 0; i < len; i++) {
        var existingHandler = this._messageHandlers[i];
        if (messageName === existingHandler.messageName &&
            bundleName === existingHandler.bundleName) {
            console.error('[nodecg-api] %s attempted to declare a duplicate listenFor handler:',
                this.bundleName, bundleName, messageName);
            return;
        }
    }

    this._messageHandlers.push({
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

    var changeHandler = args.onChange || args.setter || function() {};
    var changeHandlerType = args.onChange ? 'onChange' : 'setter';
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
        var len =  self._varChangeHandlers.length;
        for (var i = 0; i < len; i++) {
            var existingHandler = self._varChangeHandlers[i];
            if (name === existingHandler.variableName &&
                bundle === existingHandler.bundleName) {
                console.error('[nodecg-api] %s attempted to declare a duplicate synced var:',
                    self.bundleName, bundle, name);
                return;
            }
        }

        // Cache it so the getter can function with no delay
        self.unobserveVariables();
        self.variables[name] = value;
        console.log(self.variables);
        self.observeVariables();

        // Add the 'setter' callback to the array of handlers that will be invoked
        // when the value of this variable changes
        self._varChangeHandlers.push({
            bundleName: bundle,
            variableName: name,
            func: changeHandler,
            type: changeHandlerType
        });

        // Run the setter with the initial value, or the found value if the var already existed
        if (changeHandlerType === 'setter') {
            changeHandler(value);
        } else if (changeHandlerType === 'onChange') {
            changeHandler(undefined, value);
        }
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
