'use strict';

const pjson = require('../../package.json');
const configHelper = require('../config');
const {config} = configHelper;
global.exitOnUncaught = config.exitOnUncaught;

const Raven = require('raven');
const ravenConfig = require('../util/raven-config');
if (config.sentry && config.sentry.enabled) {
	Raven.config(config.sentry.dsn, ravenConfig).install();
	global.sentryEnabled = true;

	process.on('unhandledRejection', (reason, p) => {
		console.error('Unhandled Rejection at:', p, 'reason:', reason);
		Raven.captureException(reason);
	});

	console.info('[nodecg] Sentry enabled.');
}

// Native
const {EventEmitter} = require('events');
const fs = require('fs');
const path = require('path');

// Packages
const bodyParser = require('body-parser');
const clone = require('clone');
const debounce = require('lodash.debounce');
const express = require('express');
const fetch = require('make-fetch-happen');
const semver = require('semver');
const template = require('lodash.template');
const memoize = require('fast-memoize');
const transformMiddleware = require('express-transform-bare-module-specifiers').default;

// Ours
const bundleManager = require('../bundle-manager');
const Logger = require('../logger');
const tokens = require('../login/tokens');
const UnauthorizedError = require('../login/UnauthorizedError');

const log = new Logger('nodecg/lib/server');
const authorizedSockets = {};
let app;
let server;
let io;
let extensionManager;

// Check for updates
fetch('http://registry.npmjs.org/nodecg/latest').then(res => {
	return res.json(); // Download the body as JSON
}).then(body => {
	if (semver.gt(body.version, pjson.version) >= 1) {
		log.warn('An update is available for NodeCG: %s (current: %s)', JSON.parse(body).version, pjson.version);
	}
}).catch(/* istanbul ignore next */() => {
	// Discard errors.
});

const renderTemplate = memoize((content, options) => {
	return template(content)(options);
});

module.exports = new EventEmitter();

module.exports.start = function () {
	log.info('Starting NodeCG %s (Running on Node.js %s)', pjson.version, process.version);

	// (Re)create Express app, HTTP(S) & Socket.IO servers
	app = express();

	if (global.sentryEnabled) {
		app.use(Raven.requestHandler());
		app.use(Raven.errorHandler());
	}

	if (config.ssl && config.ssl.enabled) {
		const sslOpts = {
			key: fs.readFileSync(config.ssl.keyPath),
			cert: fs.readFileSync(config.ssl.certificatePath)
		};
		if (config.ssl.passphrase) {
			sslOpts.passphrase = config.ssl.passphrase;
		}

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

	// Set up Express
	log.trace('Setting up Express');
	app.use(require('compression')());
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({extended: true}));

	app.engine('tmpl', (filePath, options, callback) => {
		fs.readFile(filePath, (error, content) => {
			if (error) {
				return callback(error);
			}

			return callback(null, renderTemplate(content, options));
		});
	});

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

	const bundlesPaths = [path.join(process.env.NODECG_ROOT, 'bundles')].concat(config.bundles.paths);
	const cfgPath = path.join(process.env.NODECG_ROOT, 'cfg');

	if (global.isZeitPkg) {
		bundlesPaths.unshift(path.resolve(__dirname, '../../bundles'));
	}

	const dashboardTransformRootDir = path.resolve(__dirname, '../..');
	app.use('/node_modules/*', transformMiddleware({
		rootDir: path.join(dashboardTransformRootDir, 'node_modules'),
		modulesUrl: '/node_modules'
	}));

	app.use('/dashboard/*', transformMiddleware({
		rootDir: path.join(dashboardTransformRootDir, 'src'),
		modulesUrl: '/node_modules'
	}));

	bundleManager.init(bundlesPaths, cfgPath, pjson.version, config, Logger);

	bundleManager.all().forEach(bundle => {
		if (bundle.transformBareModuleSpecifiers) {
			const opts = {
				rootDir: global.isZeitPkg ?
					path.resolve(__dirname, '../../') :
					process.env.NODECG_ROOT,
				modulesUrl: `/bundles/${bundle.name}/node_modules`
			};
			app.use(`/bundles/${bundle.name}/*`, transformMiddleware(opts));
		}
	});

	io.on('error', err => {
		if (global.sentryEnabled) {
			Raven.captureException(err);
		}

		log.error(err.stack);
	});

	io.on('connection', socket => {
		log.trace('New socket connection: ID %s with IP %s', socket.id, socket.handshake.address);

		socket.on('error', err => {
			if (global.sentryEnabled) {
				Raven.captureException(err);
			}

			log.error(err.stack);
		});

		socket.on('message', data => {
			log.debug('Socket %s sent a message:', socket.id, data);
			io.emit('message', data);
		});

		socket.on('joinRoom', (room, cb) => {
			if (typeof room !== 'string') {
				throw new Error('Room must be a string');
			}

			if (Object.keys(socket.rooms).indexOf(room) < 0) {
				log.trace('Socket %s joined room:', socket.id, room);
				socket.join(room);
			}

			if (typeof cb === 'function') {
				cb();
			}
		});

		if (config.login && config.login.enabled) {
			const {token} = socket;
			if (!{}.hasOwnProperty.call(authorizedSockets, token)) {
				authorizedSockets[token] = [];
			}

			if (authorizedSockets[token].indexOf(socket) < 0) {
				authorizedSockets[token].push(socket);
			}

			socket.on('disconnect', () => {
				// Sockets for this token might have already been invalidated
				if ({}.hasOwnProperty.call(authorizedSockets, token)) {
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
								socket.error(new UnauthorizedError('token_invalidated', {
									message: 'This token has been invalidated'
								}).data);

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

	log.trace(`Attempting to listen on ${config.host}:${config.port}`);
	server.on('error', err => {
		switch (err.code) {
			case 'EADDRINUSE':
				if (process.env.NODECG_TEST) {
					return;
				}

				log.error(`[server.js] Listen ${config.host}:${config.port} in use, is NodeCG already running? NodeCG will now exit.`);
				break;
			default:
				log.error('Unhandled error!', err);
				break;
		}

		module.exports.emit('error', err);
	});

	log.trace('Starting graphics lib');
	const graphics = require('../graphics');
	app.use(graphics);

	log.trace('Starting dashboard lib');
	const dashboard = require('../dashboard');
	app.use(dashboard);

	log.trace('Starting mounts lib');
	const mounts = require('../mounts');
	app.use(mounts);

	log.trace('Starting bundle sounds lib');
	const sounds = require('../sounds');
	app.use(sounds);

	log.trace('Starting bundle assets lib');
	const assets = require('../assets');
	app.use(assets);

	log.trace('Starting bundle shared sources lib');
	const sharedSources = require('../shared-sources');
	app.use(sharedSources);

	// Set up "bundles" Replicant.
	const Replicant = require('../replicant');
	const bundlesReplicant = new Replicant('bundles', 'nodecg', {
		schemaPath: path.resolve(__dirname, '../../schemas/bundles.json'),
		persistent: false
	});
	const updateBundlesReplicant = debounce(() => {
		bundlesReplicant.value = clone(bundleManager.all());
	}, 100);
	bundleManager.on('init', updateBundlesReplicant);
	bundleManager.on('bundleChanged', updateBundlesReplicant);
	bundleManager.on('gitChanged', updateBundlesReplicant);
	bundleManager.on('bundleRemoved', updateBundlesReplicant);
	updateBundlesReplicant();

	extensionManager = require('./extensions.js');
	extensionManager.init();
	module.exports.emit('extensionsLoaded');

	// We intentionally wait until all bundles and extensions are loaded before starting the server.
	// This has two benefits:
	// 1) Prevents the dashboard/views from being opened before everything has finished loading
	// 2) Prevents dashboard/views from re-declaring replicants on reconnect before extensions have had a chance
	server.listen({
		host: config.host,
		port: process.env.NODECG_TEST ? undefined : config.port
	}, () => {
		if (process.env.NODECG_TEST) {
			const {port} = server.address();
			log.warn(`Test mode active, using automatic listen port: ${port}`);
			configHelper.config.port = port;
			configHelper.filteredConfig.port = port;
			process.env.NODECG_TEST_PORT = port;
		}

		const protocol = config.ssl && config.ssl.enabled ? 'https' : 'http';
		log.info('NodeCG running on %s://%s', protocol, config.baseURL);
		module.exports.emit('started');
	});
};

module.exports.stop = function () {
	if (server) {
		server.close();
	}

	if (io) {
		io.close();
	}

	require('../replicator').saveAllReplicants();

	extensionManager = null;
	io = null;
	server = null;
	app = null;

	module.exports.emit('stopped');
};

module.exports.getExtensions = function () {
	/* istanbul ignore else */
	if (extensionManager) {
		return extensionManager.getExtensions();
	}

	/* istanbul ignore next */
	return {};
};

module.exports.getIO = function () {
	return io;
};

module.exports.mount = function (...args) {
	app.use(...args);
};
