'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events').EventEmitter;
const authors = require('parse-authors');
const tokens = require('../login/tokens');
const configHelper = require('../config');
const log = require('../logger')('nodecg/lib/server');
const bundles = require('../bundles');
const config = configHelper.config;
const authorizedSockets = {};
let app;
let server;
let io;
let extensionManager;

// Check for updates
const semver = require('semver');
const request = require('request');
const pjson = require('../../package.json');
request('http://registry.npmjs.org/nodecg/latest', (err, res, body) => {
	if (!err && res.statusCode === 200) {
		if (semver.gt(JSON.parse(body).version, pjson.version) >= 1) {
			log.warn('A new update is available for NodeCG: %s (current: %s)', JSON.parse(body).version, pjson.version);
		}
	}
});

module.exports = new EventEmitter();

module.exports.start = function () {
	log.info('Starting NodeCG %s (Running on Node.js %s)', pjson.version, process.version);

	// (Re)create Express app, HTTP(S) & Socket.IO servers
	app = express();

	if (config.rollbar && config.rollbar.enabled) {
		const rollbar = require('rollbar');
		rollbar.init(config.rollbar.postServerItem, {
			environment: config.rollbar.environment,
			codeVersion: pjson.version
		});
		rollbar.handleUncaughtExceptions(config.rollbar.postServerItem, {
			exitOnUncaughtException: true
		});
		app.use(rollbar.errorHandler(config.rollbar.postServerItem));
		global.rollbarEnabled = true;
	}

	if (config.ssl && config.ssl.enabled) {
		const sslOpts = {
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

		const protocol = config.ssl && config.ssl.enabled ? 'https' : 'http';
		log.info('NodeCG running on %s://%s', protocol, config.baseURL);
	}

	// Set up Express
	log.trace('Setting up Express');
	app.use(require('compression')());
	app.use('/components', express.static(path.resolve(__dirname, '../../bower_components')));
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));

	app.engine('jade', require('jade').__express);

	if (config.login && config.login.enabled) {
		log.info('Login security enabled');
		const login = require('../login');
		app.use(login);
		io.use(tokens.authorize());
	} else {
		app.get('/login*', (req, res) => {
			res.redirect('/dashboard');
		});
	}

	log.trace('Starting dashboard lib');
	const dashboard = require('../dashboard');
	app.use(dashboard);

	log.trace('Starting graphics lib');
	const graphics = require('../graphics');
	app.use(graphics);

	log.trace('Starting browser includes lib');
	const browserIncludes = require('../browser');
	app.use(browserIncludes);

	log.trace('Starting bundle sounds lib');
	const sounds = require('../sounds');
	app.use(sounds);

	log.trace('Starting bundle assets lib');
	const assets = require('../assets');
	app.use(assets);

	io.on('connection', socket => {
		log.trace('New socket connection: ID %s with IP %s', socket.id, socket.handshake.address);

		socket.on('message', data => {
			log.debug('Socket %s sent a message:', socket.id, data);
			io.emit('message', data);
		});

		socket.on('joinRoom', (room, cb) => {
			if (typeof room !== 'string') {
				throw new Error('Room must be a string');
			}
			if (Object.keys(socket.rooms).indexOf(room) < 0) {
				log.debug('Socket %s joined room:', socket.id, room);
				socket.join(room);
			}
			if (typeof cb === 'function') {
				cb();
			}
		});

		socket.on('getBundleManifest', (bundleName, cb) => {
			log.debug('Socket %s requested manifest for bundle %d:', socket.id, bundleName);
			if (typeof bundleName !== 'string') {
				const err = new Error('bundleName must be a string');
				cb(err);
			}

			if (typeof cb === 'function') {
				const bundle = bundles.find(bundleName);
				if (bundle) {
					const manifest = JSON.parse(bundle.rawManifest);

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

		if (config.login && config.login.enabled) {
			const token = socket.token;
			if (!authorizedSockets.hasOwnProperty(token)) {
				authorizedSockets[token] = [];
			}

			if (authorizedSockets[token].indexOf(socket) < 0) {
				authorizedSockets[token].push(socket);
			}

			socket.on('disconnect', () => {
				// Sockets for this token might have already been invalidated
				if (authorizedSockets.hasOwnProperty(token)) {
					const idx = authorizedSockets[token].indexOf(socket);
					if (idx >= 0) {
						authorizedSockets[token].splice(idx, 1);
					}
				}
			});

			socket.on('regenerateToken', (token, cb) => {
				log.debug('Socket %s requested a new token:', socket.id);
				cb = cb || function () {};

				tokens.regenerate(token, (err, newToken) => {
					if (err) {
						log.error(err.stack);
						cb(err);
						return;
					}

					cb(null, newToken);

					function invalidate() {
						// Disconnect all sockets using this token
						if (Array.isArray(authorizedSockets[token])) {
							const sockets = authorizedSockets[token].slice(0);
							sockets.forEach(socket => {
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
	server.on('error', err => {
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

module.exports.stop = function () {
	server.close();
	io.close();

	extensionManager = null;
	io = null;
	server = null;
	app = null;

	module.exports.emit('stopped');
};

module.exports.getExtensions = function () {
	if (extensionManager) {
		return extensionManager.getExtensions();
	}

	return {};
};

module.exports.getIO = function () {
	return io;
};

module.exports.mount = function (middleware) {
	app.use(middleware);
};