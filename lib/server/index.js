'use strict';

var express = require('express');
var app = null;
var server = null;
var io = null;
var bodyParser = require('body-parser');
var fs = require('fs');
var path = require('path');
var EventEmitter = require('events').EventEmitter;

var configHelper = require('../config');
var config = configHelper.config;
var log = require('../logger')('nodecg/lib/server');
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

exports = new EventEmitter();

exports.start = function() {
    log.info('Starting NodeCG %s (Running on Node.js %s)', pjson.version, process.version);
    // Get a fresh config before starting
    config = configHelper.getConfig();

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
    extensionManager.on('extensionsLoaded', function() {
        exports.emit('extensionsLoaded');

        // We intentionally wait until all bundles and extensions are loaded before starting the server.
        // This has two benefits:
        // 1) Prevents the dashboard/views from being opened before everything has finished loading
        // 2) Prevents dashboard/views from re-declaring synced vars on reconnect before extensions have had a chance
        server.listen(config.listen);
        exports.emit('started');

        var protocol = config.ssl.enabled ?
            'https' :
            'http';
        log.info('NodeCG running on %s://%s', protocol, config.baseURL);
    });

    // Set up Express
    log.trace('Setting up Express');
    app.use('/components', express.static(path.join(__dirname, '..', '..', 'bower_components')));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));

    app.engine('jade', require('jade').__express);
    app.engine('html', require('ejs').renderFile);
    app.engine('ejs', require('ejs').renderFile);

    app.all('*', function (req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });

    if (config.login.enabled) {
        log.info('Login security enabled');
        var login = require('../login');
        app.use(login);
    } else {
        app.get('/login*', function(req, res) {
            res.redirect('/dashboard');
        });
    }

    log.trace('Starting dashboard lib');
    var dashboard = require('../dashboard');
    app.use(dashboard);

    log.trace('Starting bundle views lib');
    var bundleViews = require('../bundle_views');
    app.use(bundleViews);

    io.on('connection', function onConnection(socket) {
        log.trace('New socket connection: ID %s with IP %s', socket.id, socket.handshake.address);

        socket.on('message', function onMessage(data) {
            log.debug('Socket %s sent a message:', socket.id, data);
            io.emit('message', data);
        });
    });

    log.trace('Attempting to listen on %s', config.listen);
    server.on('error', function(err) {
        exports.emit('error', err);

        switch (err.code) {
            case 'EADDRINUSE':
                log.error('[server.js] Listen %s in use, is NodeCG already running? NodeCG will now exit.', config.listen);
                break;
            default:
                log.error('Unhandled error!', err);
                break;
        }
    });
};

exports.stop = function() {
    server.close();
    io.close();

    extensionManager = null;
    io = null;
    server = null;
    app = null;

    exports.emit('stopped');
};

exports.getExtensions = function() {
    if (extensionManager) {
        return extensionManager.getExtensions();
    }

    return {};
};

exports.getIO = function() {
    return io;
};

exports.mount = function (middleware) {
    app.use(middleware);
};

module.exports = exports;
