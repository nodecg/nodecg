/* jshint unused:false */
'use strict';

var syncedVariables = require('../synced_variables');
var io = {};
var server = require('../server');
var log = require('../logger')('nodecg/lib/extension_api');
var filteredConfig = require('../config').getFilteredConfig();
var utils = require('../util');
var Nested = require('nested-observe');
var objectPath = require('object-path');

/**
 * Creates a new NodeCG extension API instance.
 * @constructor
 * @param {object} bundle The bundle object to build an API instance from.
 */
function NodeCG(bundle) {
    // Make bundle name and config publicly accessible
    this.bundleName = bundle.name;
    this.bundleConfig = bundle.config;

    // Make logger publicly accessible
    this.log = require('../logger')('extension/' + bundle.name);

    // Initialize internal data structures and make them accessible to public methods
    this.variables = {};
    this._messageHandlers = [];
    this._varChangeHandlers = [];

    var self = this;

    function observeVariables() {
        Nested.observe(self.variables, onChangeObserved);
    }

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

            syncedVariables.digestChanges(self.bundleName, formattedChanges, roots);
        } catch (e) {
            log.error(e.stack);
        }
    }

    function unobserveVariables() {
        if (!self.variables) return;
        Nested.unobserve(self.variables, onChangeObserved);
    }

    observeVariables();

    io = server.getIO();

    io.on('connection', function onConnection(socket) {
        socket.setMaxListeners(64); // Prevent console warnings when many extensions are installed
        socket.on('message', function onMessage(data, cb) {
            log.trace('[%s] Socket %s sent a message (callback: %s):', self.bundleName, socket.id, data, Boolean(cb));
            var len = self._messageHandlers.length;
            for (var i = 0; i < len; i++) {
                var handler = self._messageHandlers[i];
                if (data.messageName === handler.messageName &&
                    data.bundleName === handler.bundleName) {
                    handler.func(data.content, cb);
                }
            }
        });
    });

    // Create read-only config property, which contains the current filtered NodeCG config
    Object.defineProperty(this, 'config', {
        value: filteredConfig,
        writable: false,
        enumerable: true
    });
    Object.freeze(this.config);

    // ###syncedVariables events
    syncedVariables

        // This event is currently unused.
        .on('variableDeclared', function variableDeclared(data) {})

        .on('variableChanged', function variableChanged(data) {
            if (!self.variables.hasOwnProperty(data.variableName)) return;
            log.trace('[%s] Variable changed:', self.bundleName, data);
            data.changes.forEach(function(change) {
                switch(change.type) {
                    case 'add':
                    case 'update':
                        // Set the new value
                        unobserveVariables();
                        objectPath.set(self.variables, change.path, change.newValue);
                        observeVariables();

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
                        unobserveVariables();
                        objectPath.del(self.variables, change.path);
                        observeVariables();
                        // invoke delete handler
                        break;
                }
            });
        })

        // When a syncedVar is destroyed, remove its handlers and the property from `nodecg.variables`
        .on('variableDestroyed', function variableDestroyed(data) {
            log.trace('[%s] Variable destroyed:', self.bundleName, data);
            var len =  self._varChangeHandlers.length;
            for (var i = 0; i < len; i++) {
                var handler = self._varChangeHandlers[i];
                if (data.variableName === handler.variableName &&
                    data.bundleName === handler.bundleName) {
                    self._varChangeHandlers.splice(i, 1);
                }
            }

            if (self.variables.hasOwnProperty(data.variableName)) {
                delete self.variables[data.variableName];
            }
        })

        // Completely drops all trace of all syncedVariables
        // Only used in automated tests.
        .on('variablesReset', function variablesReset() {
            self._messageHandlers = [];
            self._varChangeHandlers = [];
            self.variables = {};
        });
}

// ###NodeCG prototype

/**
 * Sends a message within the current bundle.
 * @param {string}   messageName The name of the message.
 * @param {mixed}    [data]      The data to send.
 */
NodeCG.prototype.sendMessage = function (messageName, data) {
    this.sendMessageToBundle(messageName, this.bundleName, data);
};

/**
 * Sends a message to a specific bundle.
 * @param {string}   messageName The name of the message.
 * @param {string}   bundleName  The name of the target bundle.
 * @param {mixed}    [data]      The data to send
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
 * @param {string}   messageName                     The name of the message.
 * @param {string}   [bundleName=CURRENT_BUNDLE_NAME] The bundle namespace to in which to listen for this message
 * @param {function} handler                          The callback fired when this message is received.
 */
NodeCG.prototype.listenFor = function (messageName, bundleName, handler) {
    if (typeof handler === 'undefined') {
        handler = bundleName;
        bundleName = this.bundleName;
    }

    log.trace('[%s] Listening for %s from bundle %s', this.bundleName, messageName, bundleName);

    // Check if a handler already exists for this message
    var len =  this._messageHandlers.length;
    for (var i = 0; i < len; i++) {
        var existingHandler = this._messageHandlers[i];
        if (messageName === existingHandler.messageName && bundleName === existingHandler.bundleName) {
            log.error('%s attempted to declare a duplicate "listenFor" handler:',
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
    var changeHandler = args.onChange || args.setter || function() {};
    var changeHandlerType = args.onChange ? 'onChange' : 'setter';
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
    var len =  this._varChangeHandlers.length;
    for (var i = 0; i < len; i++) {
        var existingHandler = this._varChangeHandlers[i];
        if (name === existingHandler.variableName && bundle === existingHandler.bundleName) {
            log.error('%s attempted to declare a duplicate synced var:', this.bundleName, bundle, name);
            return;
        }
    }

    // Add the 'setter' callback to the array of handlers that will be invoked
    // when the value of this variable changes
    this._varChangeHandlers.push({
        bundleName: bundle,
        variableName: name,
        func: changeHandler,
        type: changeHandlerType
    });

    this.variables[name] = value;

    // Run the setter with the initial value, or the found value if the var already existed
    if (changeHandlerType === 'setter') {
        changeHandler(syncedVariables.findOrDeclare(bundle, name, value));
    } else if (changeHandlerType === 'onChange') {
        changeHandler(undefined, syncedVariables.findOrDeclare(bundle, name, value));
    }
};

/**
 * Reads the value of a synchronized variable without creating a subscription to it.
 * @param {string}   name                         The name of the variable.
 * @param {string}   [bundle=CURRENT_BUNDLE_NAME] The bundle namespace to in which to look for this variable
 */
NodeCG.prototype.readSyncedVar = function(name, bundle) {
    bundle = bundle || this.bundleName;
    return syncedVariables.find(bundle, name);
};

/**
 * Destroys a synchronized variable, and causes it to be removed from all API instances.
 * @param {object} args            The arguments object.
 * @param {string} args.name       The name of the synced variable to destroy.
 * @param {string} args.bundleName The bundle namespace in which to destroy this variable.
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

/**
 * Gets the server Socket.IO context.
 */
NodeCG.prototype.getSocketIOServer = server.getIO;

/**
 * Mounts express middleware to the main server express app.
 * See http://expressjs.com/api.html#app.use for usage.
 */
NodeCG.prototype.mount = server.mount;

NodeCG.prototype.util = {};

/**
 * Checks if a session is authorized. Intended to be used in express routes.
 * @param {object}   req   A HTTP request.
 * @param {object}   res   A HTTP response.
 * @param {function} next  The next middleware in the control flow.
 */
NodeCG.prototype.util.authCheck = utils.authCheck;

/**
 * Finds and returns a session that matches the given parameters.
 * @param {object} params   A NeDB search query [https://github.com/louischatriot/nedb#finding-documents].
 * @returns {object}
 */
NodeCG.prototype.util.findSession = utils.findSession;

/**
 * Destroys the session matching the given SID
 * @param {string} sid      The session ID to destroy
 */
NodeCG.prototype.util.destroySession = utils.destroySession;

// Make all extensions accessible via 'nodecg.extensions'
Object.defineProperty(NodeCG.prototype, 'extensions', {
    get: function() {
        return server.getExtensions();
    },
    enumerable: true
});

module.exports = NodeCG;
