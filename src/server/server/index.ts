// Minimal imports for first setup
import '../../../scripts/warn-engines.js';
import * as os from 'os';
import * as Sentry from '@sentry/node';
import { config, filteredConfig } from '../config';
import '../util/sentry-config';
import { pjson } from '../util';

global.exitOnUncaught = config.exitOnUncaught;
if (config.sentry?.enabled) {
	Sentry.init({
		dsn: config.sentry.dsn,
		serverName: os.hostname(),
		release: pjson.version,
	});
	Sentry.configureScope((scope) => {
		scope.setTags({
			nodecgHost: config.host,
			nodecgBaseURL: config.baseURL,
		});
	});
	global.sentryEnabled = true;

	process.on('unhandledRejection', (reason, p) => {
		console.error('Unhandled Rejection at:', p, 'reason:', reason);
		Sentry.captureException(reason);
	});

	console.info('[nodecg] Sentry enabled.');
}

// Native
import fs = require('fs');
import path = require('path');

// Packages
import bodyParser from 'body-parser';
import { klona as clone } from 'klona/json';
import debounce from 'lodash.debounce';
import express from 'express';
import template from 'lodash.template';
import memoize from 'fast-memoize';
import transformMiddleware from 'express-transform-bare-module-specifiers';
import compression from 'compression';
import type { Server } from 'http';
import SocketIO from 'socket.io';
import passport from 'passport';

// Ours
import BundleManager from '../bundle-manager';
import createLogger from '../logger';
import socketAuthMiddleware from '../login/socketAuthMiddleware';
import socketApiMiddleware from './socketApiMiddleware';
import Replicator from '../replicant/replicator';
import * as db from '../database';
import type { ClientToServerEvents, ServerToClientEvents, TypedSocketServer } from '../../types/socket-protocol';
import GraphicsLib from '../graphics';
import DashboardLib from '../dashboard';
import MountsLib from '../mounts';
import SoundsLib from '../sounds';
import AssetManager from '../assets';
import SharedSourcesLib from '../shared-sources';
import ExtensionManager from './extensions';
import SentryConfig from '../util/sentry-config';
import type { NodeCG } from '../../types/nodecg';
import { TypedEmitter } from '../../shared/typed-emitter';
import rootPath from '../../shared/utils/rootPath';

const renderTemplate = memoize((content, options) => template(content)(options));

type EventMap = {
	error: (error: unknown) => void;
	extensionsLoaded: () => void;
	started: () => void;
	stopped: () => void;
};

export default class NodeCGServer extends TypedEmitter<EventMap> {
	readonly log = createLogger('server');

	private readonly _io: TypedSocketServer;

	private readonly _app = express();

	private readonly _server: Server;

	private _replicator?: Replicator;

	private _extensionManager?: ExtensionManager;

	/**
	 * Only used by tests. Gross hack.
	 */
	// @ts-expect-error Used only by tests.
	private _bundleManager: BundleManager;

	constructor() {
		super();

		this.mount = this.mount.bind(this);

		/**
		 * HTTP(S) server setup
		 */
		const { _app: app } = this;
		let server: Server;
		if (config.ssl?.enabled) {
			const sslOpts: { key: Buffer; cert: Buffer; passphrase?: string } = {
				key: fs.readFileSync(config.ssl.keyPath),
				cert: fs.readFileSync(config.ssl.certificatePath),
			};
			if (config.ssl.passphrase) {
				sslOpts.passphrase = config.ssl.passphrase;
			}

			// If we allow HTTP on the same port, use httpolyglot
			// otherwise, standard https server
			server = config.ssl.allowHTTP
				? require('httpolyglot').createServer(sslOpts, app)
				: require('https').createServer(sslOpts, app);
		} else {
			server = require('http').createServer(app);
		}

		/**
		 * Socket.IO server setup.
		 */
		this._io = new SocketIO.Server<ClientToServerEvents, ServerToClientEvents>(server);
		this._io.setMaxListeners(75); // Prevent console warnings when many extensions are installed
		this._io.on('error', (err) => {
			if (global.sentryEnabled) {
				Sentry.captureException(err);
			}

			this.log.error(err.stack);
		});

		this._server = server;
	}

	async start(): Promise<void> {
		const { _app: app, _server: server, log } = this;
		const io = this._io.of('/');
		log.info('Starting NodeCG %s (Running on Node.js %s)', pjson.version, process.version);

		const database = await db.getConnection();
		if (global.sentryEnabled) {
			app.use(Sentry.Handlers.requestHandler());
		}

		// Set up Express
		app.use(compression());
		app.use(bodyParser.json());
		app.use(bodyParser.urlencoded({ extended: true }));

		app.set('trust proxy', true);

		app.engine('tmpl', (filePath: string, options: any, callback: any) => {
			fs.readFile(filePath, (error, content) => {
				if (error) {
					return callback(error);
				}

				return callback(null, renderTemplate(content, options));
			});
		});

		if (config.login?.enabled) {
			log.info('Login security enabled');
			const login = await import('../login');
			const { app: loginMiddleware, sessionMiddleware } = await login.createMiddleware({
				onLogin: (user) => {
					// If the user had no roles, then that means they "logged in"
					// with a third-party auth provider but weren't able to
					// get past the login page because the NodeCG config didn't allow that user.
					// At this time, we only tell extensions about users that are valid.
					if (user.roles.length > 0) {
						this._extensionManager?.emitToAllInstances('login', user);
					}
				},
				onLogout: (user) => {
					if (user.roles.length > 0) {
						this._extensionManager?.emitToAllInstances('logout', user);
					}
				},
			});
			app.use(loginMiddleware);

			// convert a connect middleware to a Socket.IO middleware
			const wrap = (middleware: any) => (socket: SocketIO.Socket, next: any) =>
				middleware(socket.request, {}, next);

			io.use(wrap(sessionMiddleware));
			io.use(wrap(passport.initialize()));
			io.use(wrap(passport.session()));

			this._io.use(socketAuthMiddleware);
		} else {
			app.get('/login*', (_, res) => {
				res.redirect('/dashboard');
			});
		}

		this._io.use(socketApiMiddleware);

		const bundlesPaths = [path.join(process.env.NODECG_ROOT, 'bundles')].concat(config.bundles?.paths ?? []);
		const cfgPath = path.join(process.env.NODECG_ROOT, 'cfg');
		const bundleManager = new BundleManager(bundlesPaths, cfgPath, pjson.version, config);

		// Wait for Chokidar to finish its initial scan.
		await new Promise<void>((resolve, reject) => {
			let handled = false;
			const timeout = setTimeout(() => {
				if (handled) return;
				handled = true;
				reject(new Error('Timed out while waiting for the bundle manager to become ready.'));
			}, 15000);

			if (bundleManager.ready) {
				succeed();
			} else {
				bundleManager.once('ready', () => {
					succeed();
				});
			}

			function succeed() {
				if (handled) return;
				handled = true;
				clearTimeout(timeout);
				resolve();
			}
		});

		bundleManager.all().forEach((bundle) => {
			// TODO: remove this feature in v3
			if (bundle.transformBareModuleSpecifiers) {
				log.warn(
					`${bundle.name} uses the deprecated "transformBareModuleSpecifiers" feature. ` +
						'This feature will be removed in NodeCG v3. ' +
						'Please migrate to using browser-native import maps instead: ' +
						'https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap',
				);
				const opts = {
					rootDir: process.env.NODECG_ROOT,
					modulesUrl: `/bundles/${bundle.name}/node_modules`,
				};
				app.use(`/bundles/${bundle.name}/*`, transformMiddleware(opts));
			}
		});

		// Only used by tests. Kinda gross. Sorry.
		this._bundleManager = bundleManager;

		log.trace(`Attempting to listen on ${config.host}:${config.port}`);
		server.on('error', (err) => {
			switch ((err as any).code) {
				case 'EADDRINUSE':
					if (process.env.NODECG_TEST) {
						return;
					}

					log.error(
						`Listen ${config.host}:${config.port} in use, is NodeCG already running? NodeCG will now exit.`,
					);
					break;
				default:
					log.error('Unhandled error!', err);
					break;
			}

			this.emit('error', err);
		});

		if (global.sentryEnabled) {
			const sentryHelpers = new SentryConfig(bundleManager);
			app.use(sentryHelpers.app);
		}

		const persistedReplicantEntities = await database.getRepository(db.Replicant).find();
		const replicator = new Replicator(io, persistedReplicantEntities);
		this._replicator = replicator;

		const graphics = new GraphicsLib(io, bundleManager, replicator);
		app.use(graphics.app);

		const dashboard = new DashboardLib(bundleManager);
		app.use(dashboard.app);

		const mounts = new MountsLib(bundleManager.all());
		app.use(mounts.app);

		const sounds = new SoundsLib(bundleManager.all(), replicator);
		app.use(sounds.app);

		const assets = new AssetManager(bundleManager.all(), replicator);
		app.use(assets.app);

		const sharedSources = new SharedSourcesLib(bundleManager.all());
		app.use(sharedSources.app);

		if (global.sentryEnabled) {
			app.use(Sentry.Handlers.errorHandler());
		}

		// Fallthrough error handler,
		// Taken from https://docs.sentry.io/platforms/node/express/
		app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
			res.statusCode = 500;
			if (global.sentryEnabled) {
				// The error id is attached to `res.sentry` to be returned
				// and optionally displayed to the user for support.
				res.end(`Internal error\nSentry issue ID: ${String((res as any).sentry)}\n`);
			} else {
				res.end('Internal error');
			}

			this.log.error(err);
		});

		// Set up "bundles" Replicant.
		const bundlesReplicant = replicator.declare('bundles', 'nodecg', {
			schemaPath: path.resolve(rootPath.path, 'schemas/bundles.json'),
			persistent: false,
		});
		const updateBundlesReplicant = debounce(() => {
			bundlesReplicant.value = clone(bundleManager.all());
		}, 100);
		bundleManager.on('ready', updateBundlesReplicant);
		bundleManager.on('bundleChanged', updateBundlesReplicant);
		bundleManager.on('gitChanged', updateBundlesReplicant);
		bundleManager.on('bundleRemoved', updateBundlesReplicant);
		updateBundlesReplicant();

		const extensionManager = new ExtensionManager(io, bundleManager, replicator, this.mount);
		this._extensionManager = extensionManager;
		this.emit('extensionsLoaded');
		this._extensionManager?.emitToAllInstances('extensionsLoaded');

		// We intentionally wait until all bundles and extensions are loaded before starting the server.
		// This has two benefits:
		// 1) Prevents the dashboard/views from being opened before everything has finished loading
		// 2) Prevents dashboard/views from re-declaring replicants on reconnect before extensions have had a chance
		return new Promise((resolve) => {
			server.listen(
				{
					host: config.host,
					port: process.env.NODECG_TEST ? undefined : config.port,
				},
				() => {
					if (process.env.NODECG_TEST) {
						const addrInfo = server.address();
						if (typeof addrInfo !== 'object' || addrInfo === null) {
							throw new Error("couldn't get port number");
						}

						const { port } = addrInfo;
						log.warn(`Test mode active, using automatic listen port: ${port}`);
						config.port = port;
						filteredConfig.port = port;
						process.env.NODECG_TEST_PORT = String(port);
					}

					const protocol = config.ssl?.enabled ? 'https' : 'http';
					log.info('NodeCG running on %s://%s', protocol, config.baseURL);
					this.emit('started');
					this._extensionManager?.emitToAllInstances('serverStarted');
					resolve();
				},
			);
		});
	}

	async stop(): Promise<void> {
		this._extensionManager?.emitToAllInstances('serverStopping');
		this._io.disconnectSockets(true);

		await new Promise<void>((resolve) => {
			// Also closes the underlying HTTP server.
			this._io.close(() => {
				resolve();
			});
		});

		if (this._replicator) {
			this._replicator.saveAllReplicants();
		}

		this.emit('stopped');
	}

	getExtensions(): Record<string, unknown> {
		return { ...this._extensionManager?.extensions };
	}

	getSocketIOServer(): TypedSocketServer {
		return this._io;
	}

	mount: NodeCG.Middleware = (...args: any[]) => this._app.use(...args);

	async saveAllReplicantsNow(): Promise<void> {
		return this._replicator?.saveAllReplicantsNow();
	}
}
