/* jshint unused:false */
'use strict';

var Replicant = require('./replicant');
var io = {};
var server = require('./server');
var filteredConfig = require('./config').getFilteredConfig();
var utils = require('./util');
var replicator = require('./replicator');

/**
 * Creates a new NodeCG extension API instance.
 * @constructor
 * @param {object} bundle The bundle object to build an API instance from.
 */
function NodeCG(bundle, socket) {
    var self = this;

    // Make bundle name and config publicly accessible
    this.bundleName = bundle.name;
    this.bundleConfig = bundle.config;

    // Make logger publicly accessible
    this.log = require('./logger')(bundle.name);

    this._messageHandlers = [];

    if (process.env.browser) {
        // This constructor only works if socket.io is loaded
        if (typeof io === 'undefined') {
            throw new Error('[nodeceg] Socket.IO must be loaded before instantiating the API');
        }

        // If title isn't set, set it to the bundle name
        document.addEventListener('DOMContentLoaded', function() {
            if (document.title === '') document.title = self.bundleName;
        }, false);

        // Make socket accessible to public methods
        this.socket = socket;
        this.socket.emit('joinRoom', bundle.name);

        // Upon receiving a message, execute any handlers for it
        socket.on('message', function onMessage(data) {
            self.log.trace('[%s] Received message %s (sent to bundle %s) with data:',
                self.bundleName, data.messageName, data.bundleName, data.content);

            self._messageHandlers.forEach(function(handler) {
                if (data.messageName === handler.messageName &&
                    data.bundleName === handler.bundleName) {
                    handler.func(data.content);
                }
            });
        });

        socket.on('error', function(err) {
            if (err.type === 'UnauthorizedError') {
                var url = [location.protocol, '//', location.host, location.pathname].join('');
                window.location.href = '/authError?code='+err.code+'&message='+err.message+'&viewUrl='+url;
            } else {
                self.log.error('Unhandled socket error:', err);
            }
        });
    } else {
        io = server.getIO();

        io.on('connection', function onConnection(socket) {
            socket.setMaxListeners(64); // Prevent console warnings when many extensions are installed
            socket.on('message', function onMessage(data, cb) {
                self.log.trace('[%s] Received message %s (sent to bundle %s) with data:',
                    self.bundleName, data.messageName, data.bundleName, data.content);

                self._messageHandlers.forEach(function(handler) {
                    if (data.messageName === handler.messageName &&
                        data.bundleName === handler.bundleName) {
                        handler.func(data.content, cb);
                    }
                });
            });
        });
    }

    // Create read-only config property, which contains the current filtered NodeCG config
    Object.defineProperty(this, 'config', {
        value: filteredConfig,
        writable: false,
        enumerable: true
    });
    Object.freeze(this.config);
}

// ###NodeCG prototype

/**
 * Sends a message within the current bundle.
 * @param {string}   messageName The name of the message.
 * @param {mixed}    [data]      The data to send.
 */
NodeCG.prototype.sendMessage = function (messageName, data, callback) {
    if (typeof callback === 'undefined' && typeof data === 'function') {
        callback = data;
        data = null;
    }

    this.sendMessageToBundle(messageName, this.bundleName, data, callback);
};

/**
 * Sends a message to a specific bundle.
 * @param {string}   messageName The name of the message.
 * @param {string}   bundleName  The name of the target bundle.
 * @param {mixed}    [data]      The data to send
 */
NodeCG.prototype.sendMessageToBundle = function (messageName, bundleName, data, callback) {
    this.log.trace('[%s] Sending message %s to bundle %s with data:',
        this.bundleName, messageName, bundleName, data);

    if (process.env.browser) {
        if (typeof callback === 'undefined' && typeof data === 'function') {
            callback = data;
            data = null;
        }

        this.socket.emit('message', {
            bundleName: bundleName,
            messageName: messageName,
            content: data
        }, callback);
    } else {
        io.emit('message', {
            bundleName: bundleName,
            messageName: messageName,
            content: data
        });
    }
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

    this.log.trace('[%s] Listening for %s from bundle %s', this.bundleName, messageName, bundleName);

    // Check if a handler already exists for this message
    var len = this._messageHandlers.length;
    for (var i = 0; i < len; i++) {
        var existingHandler = this._messageHandlers[i];
        if (messageName === existingHandler.messageName && bundleName === existingHandler.bundleName) {
            this.log.error('%s attempted to declare a duplicate "listenFor" handler:',
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

NodeCG.Replicant = function(name, bundle, opts) {
    return new Replicant(name, bundle, opts, process.env.browser ? window.socket : null);
};

NodeCG.prototype.Replicant = function(name, bundle, opts) {
    if (!bundle || typeof bundle !== 'string') {
        opts = bundle;
        bundle = this.bundleName;
    }

    return NodeCG.Replicant(name, bundle, opts);
};

/**
 * Reads the value of a synchronized variable without creating a subscription to it.
 * @param {string}   name                         The name of the variable.
 * @param {string}   [bundle=CURRENT_BUNDLE_NAME] The bundle namespace to in which to look for this replicant
 */
NodeCG.readReplicant = function(name, bundle, cb) {
    if (!name || typeof name !== 'string') {
        throw new Error('Must supply a name when reading a Replicant');
    }

    if (!bundle || typeof bundle !== 'string') {
        throw new Error('Must supply a bundle name when reading a Replicant');
    }

    if (process.env.browser) {
        window.socket.emit('readReplicant', {name: name, bundle: bundle}, cb);
    } else {
        var replicant = replicator.find(name, bundle);
        if (replicant) return replicant.value;
    }
};

NodeCG.prototype.readReplicant = function(name, bundle, cb) {
    if (!bundle || typeof bundle !== 'string') {
        cb = bundle;
        bundle = this.bundleName;
    }

    return NodeCG.readReplicant(name, bundle, cb);
};

if (!process.env.browser) {
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

    // Make all extensions accessible via 'nodecg.extensions'
    Object.defineProperty(NodeCG.prototype, 'extensions', {
        get: function() {
            return server.getExtensions();
        },
        enumerable: true
    });
}

if (process.env.browser) {
    window.NodeCG = NodeCG;
}

module.exports = NodeCG;
