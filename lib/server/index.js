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
    config = configHelper.config,
    log = require('../logger')('nodecg/lib/server'),
    syncedVars,
    extensionManager;

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
    log.info('Starting NodeCG');
    // Get a fresh config before starting
    config = configHelper.getConfig();

    syncedVars = require('../synced_variables');

    // (Re)create Express app, HTTP(S) & Socket.IO servers
    app = express();

    if (config.ssl.enabled) {
        var sslOpts = {
            key: fs.readFileSync(config.ssl.keyPath),
            cert: fs.readFileSync(config.ssl.certificatePath)
        };

        server = require('https').createServer(sslOpts, app);
    } else {
        server = require('http').createServer(app);
    }
    io = require('socket.io')(server);

    extensionManager = require('./extensions.js');
    extensionManager.on('extensionsLoaded', function() {
        extensionManager.getExpressExtensions().forEach(function(extension) {
            app.use(extension);
        });

        exports.emit('extensionsLoaded');

        // We intentionally wait until all bundles and extensions are loaded before starting the server.
        // This has two benefits:
        // 1) Prevents the dashboard/views from being opened before everything has finished loading
        // 2) Prevents dashboard/views from re-declaring synced vars on reconnect before extensions have had a chance
        server.listen(config.port);
        exports.emit('started');

        var protocol = config.ssl.enabled ?
            'https' :
            'http';
        log.info('NodeCG running on %s://%s:%s', protocol, config.host, config.port);
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

    log.trace('Attempting to listen on port %s', config.port);
    server.on('error', function(err) {
        exports.emit('error', err);

        switch (err.code) {
            case 'EADDRINUSE':
                log.error('[server.js] Port %d in use, is NodeCG already running? NodeCG will now exit.', config.port);
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

module.exports = exports;
