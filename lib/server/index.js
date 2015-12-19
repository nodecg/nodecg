'use strict';

var express = require('express');
var app = null;
var server = null;
var io = null;
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var authors = require('parse-authors');
var tokens = require('../login/tokens');
var authorizedSockets = {};

var configHelper = require('../config');
var config = configHelper.getConfig();
var log = require('../logger')('nodecg/lib/server');
var bundles = require('../bundles');
var extensionManager;

// Check for updates
var request = require('request');
var versionCompare = require('../util').versionCompare;
var pjson = require('../../package.json');
request('http://registry.npmjs.org/nodecg/latest', function (err, res, body) {
    if (!err && res.statusCode === 200) {
        if (versionCompare(JSON.parse(body).version, pjson.version) >= 1) {
            log.warn('A new update is available for NodeCG: %s (current: %s)', JSON.parse(body).version, pjson.version);
        }
    }
});

module.exports = new EventEmitter();

module.exports.start = function() {
    log.info('Starting NodeCG %s (Running on Node.js %s)', pjson.version, process.version);

    // (Re)create Express app, HTTP(S) & Socket.IO servers
    app = express();

    if (config.ssl.enabled) {
        var sslOpts = {
            key: fs.readFileSync(config.ssl.keyPath),
            cert: fs.readFileSync(config.ssl.certificatePath)
        };

        // If we allow HTTP on the same port, use httpolyglot
        // otherwise, standard https server
        server = config.ssl.allowHTTP ?
            require('httpolyglot').createServer(sslOpts, app) :
            require('https').createServer(sslOpts, app);
    } else {
        server = require('http').createServer(app);
    }
    io = require('socket.io')(server);
    io.sockets.setMaxListeners(64); // Prevent console warnings when many extensions are installed

    extensionManager = require('./extensions.js');

    if (extensionManager.allLoaded) {
        doStart();
    } else {
        extensionManager.on('extensionsLoaded', doStart);
    }

    function doStart() {
        module.exports.emit('extensionsLoaded');

        // We intentionally wait until all bundles and extensions are loaded before starting the server.
        // This has two benefits:
        // 1) Prevents the dashboard/views from being opened before everything has finished loading
        // 2) Prevents dashboard/views from re-declaring replicants on reconnect before extensions have had a chance
        server.listen(config.listen);
        module.exports.emit('started');

        var protocol = config.ssl.enabled ? 'https' : 'http';
        log.info('NodeCG running on %s://%s', protocol, config.baseURL);
    }

    // Set up Express
    log.trace('Setting up Express');
    app.use(require('compression')());
    app.use('/components', express.static(path.join(__dirname, '..', '..', 'bower_components'),
        {maxAge: 60*60*24*7*1000}));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    app.engine('jade', require('jade').__express);

    if (config.login.enabled) {
        log.info('Login security enabled');
        var login = require('../login');
        app.use(login);
        io.use(tokens.authorize());
    } else {
        app.get('/login*', function(req, res) {
            res.redirect('/dashboard');
        });
    }

    log.trace('Starting dashboard lib');
    var dashboard = require('../dashboard');
    app.use(dashboard);

    log.trace('Starting graphics lib');
    var graphics = require('../graphics');
    app.use(graphics);

    log.trace('Starting browser includes lib');
    var browserIncludes = require('../browser');
    app.use(browserIncludes);

    io.on('connection', function onConnection(socket) {
        log.trace('New socket connection: ID %s with IP %s', socket.id, socket.handshake.address);

        socket.on('message', function onMessage(data) {
            log.debug('Socket %s sent a message:', socket.id, data);
            io.emit('message', data);
        });

        socket.on('joinRoom', function onJoinRoom(room, cb) {
            log.debug('Socket %s requested to join room:', socket.id, room);
            if (typeof room !== 'string') {
                throw new Error('Room must be a string');
            }
            if (socket.rooms.indexOf(room) < 0) {
                socket.join(room);
            }
            if (typeof cb === 'function') {
                cb();
            }
        });

        socket.on('getBundleManifest', function onJoinRoom(bundleName, cb) {
            log.debug('Socket %s requested manifest for bundle %d:', socket.id, bundleName);
            if (typeof bundleName !== 'string') {
                var err = new Error('bundleName must be a string');
                cb(err);
            }

            if (typeof cb === 'function') {
                var bundle = bundles.find(bundleName);
                if (bundle) {
                    var manifest = JSON.parse(bundle.rawManifest);

                    if (manifest.author && typeof manifest.author === 'string') {
                        manifest.author = authors(manifest.author)[0];
                    }

                    if (manifest.contributors && Array.isArray(manifest.contributors)) {
                        manifest.contributors = authors(manifest.contributors.join('\n'));
                    }
                    cb(null, manifest);
                } else {
                    cb(null, null);
                }
            }
        });

        if (config.login.enabled) {
            var token = socket.token;
            if (!authorizedSockets.hasOwnProperty(token)) {
                authorizedSockets[token] = [];
            }

            if (authorizedSockets[token].indexOf(socket) < 0) {
                authorizedSockets[token].push(socket);
            }

            socket.on('disconnect', function() {
                // Sockets for this token might have already been invalidated
                if (authorizedSockets.hasOwnProperty(token)) {
                    var idx = authorizedSockets[token].indexOf(socket);
                    if (idx >= 0) {
                        authorizedSockets[token].splice(idx, 1);
                    }
                }
            });

            socket.on('regenerateToken', function onRegenerateToken(token, cb) {
                log.debug('Socket %s requested a new token:', socket.id);
                cb = cb || function(){};

                tokens.regenerate(token, function(err, newToken) {
                    if (err) {
                        log.error(err.stack);
                        cb(err);
                        return;
                    }

                    cb(null, newToken);

                    function invalidate() {
                        // Disconnect all sockets using this token
                        if (Array.isArray(authorizedSockets[token])) {
                            var sockets = authorizedSockets[token].slice(0);
                            sockets.forEach(function(socket) {
                                socket.error({
                                    message: 'This token has been invalidated',
                                    code: 'token_invalidated',
                                    type: 'UnauthorizedError'
                                });
                                socket.disconnect(true);
                            });
                        }
                    }

                    // TODO: Why is this on a timeout? If it's really needed, explain why.
                    setTimeout(invalidate, 500);
                });
            });
        }
    });

    log.trace('Attempting to listen on %s', config.listen);
    server.on('error', function(err) {
        switch (err.code) {
            case 'EADDRINUSE':
                log.error('[server.js] Listen %s in use, is NodeCG already running? NodeCG will now exit.',
                    config.listen);
                break;
            default:
                log.error('Unhandled error!', err);
                break;
        }

        module.exports.emit('error', err);
    });
};

module.exports.stop = function() {
    server.close();
    io.close();

    extensionManager = null;
    io = null;
    server = null;
    app = null;

    module.exports.emit('stopped');
};

module.exports.getExtensions = function() {
    if (extensionManager) {
        return extensionManager.getExtensions();
    }

    return {};
};

module.exports.getIO = function() {
    return io;
};

module.exports.mount = function (middleware) {
    app.use(middleware);
};
