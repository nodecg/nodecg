// Minimal imports for first setup
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
import { EventEmitter } from 'events';
import fs = require('fs');
import path = require('path');

// Packages
import bodyParser from 'body-parser';
import clone from 'clone';
import debounce from 'lodash.debounce';
import express from 'express';
import template from 'lodash.template';
import memoize from 'fast-memoize';
import transformMiddleware from 'express-transform-bare-module-specifiers';
import compression from 'compression';
import type { Server } from 'http';
import SocketIO from 'socket.io';
import appRootPath from 'app-root-path';

// Ours
import BundleManager from '../bundle-manager';
import createLogger from '../logger';
import socketAuthMiddleware from '../login/socketAuthMiddleware';
import socketApiMiddleware from './socketApiMiddleware';
import Replicator from '../replicant/replicator';
import * as db from '../database';
import type { TypedServer } from '../../types/socket-protocol';
import GraphicsLib from '../graphics';
import DashboardLib from '../dashboard';
import MountsLib from '../mounts';
import SoundsLib from '../sounds';
import AssetManager from '../assets';
import SharedSourcesLib from '../shared-sources';
import ExtensionManager from './extensions';
import SentryConfig from '../util/sentry-config';
import type { NodeCG } from '../../types/nodecg';

const renderTemplate = memoize((content, options) => template(content)(options));

export default class NodeCGServer extends EventEmitter {
	readonly log = createLogger('server');

	private readonly _io: TypedServer;

	private readonly _app = express();

	private readonly _server: Server;

	private _replicator: Replicator;

	private _extensionManager: ExtensionManager;

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
				key: fs.readFileSync(config.ssl.keyPath!),
				cert: fs.readFileSync(config.ssl.certificatePath!),
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
		 * We cast to "any" for a few things because
		 * typed-socket.io isn't quite perfect.
		 */
		this._io = SocketIO(server) as TypedServer;
		(this._io as any).setMaxListeners(75); // Prevent console warnings when many extensions are installed
		(this._io as any).on('error', (err: Error) => {
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
			app.use(await login.createMiddleware());
			(this._io as any).use(socketAuthMiddleware);
		} else {
			app.get('/login*', (_, res) => {
				res.redirect('/dashboard');
			});
		}

		(this._io as any).use(socketApiMiddleware);

		const bundlesPaths = [path.join(process.env.NODECG_ROOT, 'bundles')].concat(
			(config as any).bundles?.paths ?? [],
		);
		const cfgPath = path.join(process.env.NODECG_ROOT, 'cfg');
		const bundleManager = new BundleManager(bundlesPaths, cfgPath, pjson.version, config);
		bundleManager.all().forEach((bundle) => {
			// TODO: deprecate this feature once Import Maps are shipped and stable in browsers.
			// TODO: remove this feature after Import Maps have been around a while (like a year maybe).
			if (bundle.transformBareModuleSpecifiers) {
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
			schemaPath: path.resolve(appRootPath.path, 'schemas/bundles.json'),
			persistent: false,
		});
		const updateBundlesReplicant = debounce(() => {
			bundlesReplicant.value = clone(bundleManager.all());
		}, 100);
		bundleManager.on('init', updateBundlesReplicant);
		bundleManager.on('bundleChanged', updateBundlesReplicant);
		bundleManager.on('gitChanged', updateBundlesReplicant);
		bundleManager.on('bundleRemoved', updateBundlesReplicant);
		updateBundlesReplicant();

		const extensionManager = new ExtensionManager(io, bundleManager, replicator, this.mount);
		this._extensionManager = extensionManager;
		this.emit('extensionsLoaded');

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
					resolve();
				},
			);
		});
	}

	async stop(): Promise<void> {
		await new Promise<void>((resolve, reject) => {
			this._server.close((err) => {
				if (err) {
					reject(err);
				} else {
					resolve();
				}
			});
		});

		await new Promise<void>((resolve) => {
			(this._io as any).close(() => {
				resolve();
			});
		});

		if (this._replicator) {
			this._replicator.saveAllReplicants();
		}

		this.emit('stopped');
	}

	getExtensions(): Record<string, unknown> {
		return { ...this._extensionManager.extensions };
	}

	getSocketIOServer(): TypedServer {
		return this._io;
	}

	mount: NodeCG.Middleware = (...args: any[]) => this._app.use(...args);
}
