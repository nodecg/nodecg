'use strict';

var express = require('express'),
    app = null, // = express(),
    server = null, // = require('http').createServer(app),
    io = null, // = require('socket.io').listen(server),
    bodyParser = require('body-parser'),
    fs = require('fs'),
    path = require('path'),
    EventEmitter = require('events').EventEmitter;

var configHelper = require('../config'),
    log,
    syncedVars,
    extensionManager,
    self,
    _baseDir = null;

exports = new EventEmitter();

exports.init = function(baseDirectory) {
    if (_baseDir !== null) {
        throw new Error('Server already initialised!');
    }

    _baseDir = baseDirectory;
    configHelper.init(baseDirectory);
    this.config = configHelper.getConfig();

    log = require('../logger')('nodecg/lib/server');
    syncedVars = require('../synced_variables');
    self = this;
};

exports.start = function() {
    log.info('Starting NodeCG');
    // Get a fresh config before starting
    this.config = configHelper.getConfig();

    // (Re)create Express app, HTTP & Socket.IO servers
    app = express();
    server = require('http').createServer(app);
    io = require('socket.io')(server);

    extensionManager = require('./extensions.js');
    extensionManager.on('extensionsLoaded', function() {
        extensionManager.getExpressExtensions().forEach(function(extension) {
            app.use(extension);
        });

        self.emit('extensionsLoaded');
    });

    // Set up Express
    log.trace("Setting up Express");
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

    if (this.config.login.enabled) {
        log.info('Login security enabled');
        var login = require('../login');
        app.use(login);
    }

    log.trace("Starting dashboard lib");
    var dashboard = require('../dashboard');
    app.use(dashboard);

    log.trace("Starting bundle views lib");
    var bundleViews = require('../bundle_views');
    app.use(bundleViews);

    io.on('connection', function onConnection(socket) {
        log.trace("New socket connection: ID %s with IP %s", socket.id, socket.handshake.address);

        socket.on('message', function onMessage(data) {
            log.debug("Socket %s sent a message:", socket.id, data);
            io.emit('message', data);
        });
    });

    log.trace("Attempting to listen on port %s", this.config.port);
    server.on('error', function(err) {
        self.emit('error', err);

        switch (err.code) {
            case 'EADDRINUSE':
                log.error("[server.js] Port %d in use, is NodeCG already running? NodeCG will now exit.", self.config.port);
                break;
            default:
                log.error("Unhandled error!", err);
                break;
        }
    });

    server.listen(this.config.port);
    this.emit('started');
    log.info("NodeCG running on http://%s:%s", this.config.host, this.config.port);
};

exports.stop = function() {
    server.close();

    extensionManager = null;
    io = null;
    server = null;
    app = null;

    this.emit('stopped');
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

module.exports = exports;
