// Minimal imports for first setup
import "../util/sentry-config";

import * as Sentry from "@sentry/node";
import * as os from "os";

import { config, filteredConfig, sentryEnabled } from "../config";
import * as login from "../login";
import { nodecgPackageJson } from "../util/nodecg-package-json";

if (config.sentry?.enabled) {
	Sentry.init({
		dsn: config.sentry.dsn,
		serverName: os.hostname(),
		release: nodecgPackageJson.version,
	});
	Sentry.configureScope((scope) => {
		scope.setTags({
			nodecgHost: config.host,
			nodecgBaseURL: config.baseURL,
		});
	});

	process.on("unhandledRejection", (reason, p) => {
		console.error("Unhandled Rejection at:", p, "reason:", reason);
		Sentry.captureException(reason);
	});

	console.info("[nodecg] Sentry enabled.");
}

import fs = require("fs");
import path = require("path");

import { databaseAdapter as defaultAdapter } from "@nodecg/database-adapter-sqlite-legacy";
import { rootPaths } from "@nodecg/internal-util";
import bodyParser from "body-parser";
import compression from "compression";
import { Data, Deferred, Effect, Runtime, Stream } from "effect";
import express from "express";
import transformMiddleware from "express-transform-bare-module-specifiers";
import memoize from "fast-memoize";
import type { Server } from "http";
import { klona as clone } from "klona/json";
import { template } from "lodash";
import passport from "passport";
import * as SocketIO from "socket.io";

import type {
	ClientToServerEvents,
	ServerToClientEvents,
} from "../../types/socket-protocol";
import { UnknownError } from "../_effect/boundary";
import { listenToEvent, waitForEvent } from "../_effect/event-listener";
import { assetsRouter } from "../assets";
import { BundleManager } from "../bundle-manager";
import { dashboardRouter } from "../dashboard";
import { graphicsRouter } from "../graphics";
import { createLogger } from "../logger";
import { createSocketAuthMiddleware } from "../login/socketAuthMiddleware";
import { mountsRouter } from "../mounts";
import { Replicator } from "../replicant/replicator";
import { sharedSourceRouter } from "../shared-sources";
import { soundsRouter } from "../sounds";
import { sentryConfigRouter } from "../util/sentry-config";
import { ExtensionManager } from "./extensions";
import { socketApiMiddleware } from "./socketApiMiddleware";

const renderTemplate = memoize((content, options) =>
	template(content)(options),
);

const log = createLogger("server");

export const createServer = Effect.fn("createServer")(function* (
	isReady?: Deferred.Deferred<void>,
) {
	const app = express();

	/**
	 * HTTP(S) server setup
	 */
	const server = yield* Effect.promise(async (): Promise<Server> => {
		if (
			config.ssl.enabled &&
			config.ssl.keyPath &&
			config.ssl.certificatePath
		) {
			const sslOpts: { key: Buffer; cert: Buffer; passphrase?: string } = {
				key: fs.readFileSync(config.ssl.keyPath),
				cert: fs.readFileSync(config.ssl.certificatePath),
			};
			if (config.ssl.passphrase) {
				sslOpts.passphrase = config.ssl.passphrase;
			}

			// If we allow HTTP on the same port, use httpolyglot
			// otherwise, standard https server
			if (config.ssl.allowHTTP) {
				// TODO: Remove this
				const { createServer } = await import("httpolyglot");
				return createServer(sslOpts, app);
			} else {
				const { createServer } = await import("https");
				return createServer(sslOpts, app);
			}
		} else {
			const { createServer } = await import("http");
			return createServer(app);
		}
	});

	// Fork to immediately start listening for events
	// With scope so that it's cleaned up when the server is closed
	const waitForError = yield* Effect.forkScoped(
		waitForEvent<[unknown]>(server, "error").pipe(
			Effect.andThen(([err]) => Effect.fail(new UnknownError(err))),
		),
	);
	const waitForClose = yield* Effect.forkScoped(
		waitForEvent<[]>(server, "close"),
	);

	const io = yield* Effect.acquireRelease(
		Effect.sync(() => {
			const io = new SocketIO.Server<
				ClientToServerEvents,
				ServerToClientEvents
			>(server);
			io.setMaxListeners(75);
			return io;
		}),
		(io) =>
			Effect.promise(async () => {
				io.disconnectSockets(true);
				await io.close();
			}),
	).pipe(Effect.map((io) => io.of("/")));

	log.info(
		`Starting NodeCG ${nodecgPackageJson.version} (Running on Node.js ${process.version})`,
	);

	if (sentryEnabled) {
		app.use(Sentry.Handlers.requestHandler());
	}

	// Set up Express
	app.use(compression());
	app.use(
		bodyParser.json({
			// The verify callback receives the raw request object (IncomingMessage)
			// before body-parser processes it. We use 'any' here because we're
			// augmenting it with a property that will be available on Express.Request.
			verify: (req: any, _res, buf) => {
				req.rawBody = buf;
			},
		}),
	);
	app.use(
		bodyParser.urlencoded({
			extended: true,
			verify: (req: any, _res, buf) => {
				req.rawBody = buf;
			},
		}),
	);

	app.set("trust proxy", true);

	app.engine("tmpl", (filePath: string, options: any, callback: any) => {
		fs.readFile(filePath, (error, content) => {
			if (error) {
				return callback(error);
			}

			return callback(null, renderTemplate(content, options));
		});
	});

	const bundlesPaths = [
		path.join(rootPaths.getRuntimeRoot(), "bundles"),
	].concat(config.bundles?.paths ?? []);
	const cfgPath = path.join(rootPaths.getRuntimeRoot(), "cfg");
	const bundleManager = new BundleManager(
		bundlesPaths,
		cfgPath,
		nodecgPackageJson.version,
		config,
	);

	let databaseAdapter = defaultAdapter;
	let databaseAdapterExists = false;
	for (const bundle of bundleManager.all()) {
		if (bundle.nodecgBundleConfig.databaseAdapter) {
			log.warn(
				"`databaseAdapter` is an experimental feature and may be changed without major version bump.",
			);
			if (databaseAdapterExists) {
				throw new Error(
					"Multiple bundles are attempting to set the database adapter.",
				);
			}
			databaseAdapter = bundle.nodecgBundleConfig.databaseAdapter;
			databaseAdapterExists = true;
		}
	}

	app.use((_, res, next) => {
		res.locals.databaseAdapter = databaseAdapter;
		next();
	});

	if (config.login?.enabled) {
		log.info("Login security enabled");
		const { app: loginMiddleware, sessionMiddleware } = login.createMiddleware(
			databaseAdapter,
			{
				onLogin: (user) => {
					// If the user had no roles, then that means they "logged in"
					// with a third-party auth provider but weren't able to
					// get past the login page because the NodeCG config didn't allow that user.
					// At this time, we only tell extensions about users that are valid.
					if (user.roles.length > 0) {
						extensionManager.emitToAllInstances("login", user);
					}
				},
				onLogout: (user) => {
					if (user.roles.length > 0) {
						extensionManager.emitToAllInstances("logout", user);
					}
				},
			},
		);
		app.use(loginMiddleware);

		// convert a connect middleware to a Socket.IO middleware
		const wrap = (middleware: any) => (socket: SocketIO.Socket, next: any) =>
			middleware(socket.request, {}, next);

		io.use(wrap(sessionMiddleware));
		io.use(wrap(passport.initialize()));
		io.use(wrap(passport.session()));

		io.use(createSocketAuthMiddleware(databaseAdapter));
	} else {
		app.get("/login*", (_, res) => {
			res.redirect("/dashboard");
		});
	}

	io.use(socketApiMiddleware);

	// Wait for Chokidar to finish its initial scan.
	if (!bundleManager.ready) {
		yield* waitForEvent<[]>(bundleManager, "ready").pipe(
			Effect.timeoutFail({
				duration: "15 seconds",
				onTimeout: () => new FileWatcherReadyTimeoutError(),
			}),
		);
	}

	for (const bundle of bundleManager.all()) {
		// TODO: remove this feature in v3
		if (bundle.transformBareModuleSpecifiers) {
			log.warn(
				`${bundle.name} uses the deprecated "transformBareModuleSpecifiers" feature. ` +
					"This feature will be removed in NodeCG v3. " +
					"Please migrate to using browser-native import maps instead: " +
					"https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap",
			);
			const opts = {
				rootDir: rootPaths.getRuntimeRoot(),
				modulesUrl: `/bundles/${bundle.name}/node_modules`,
			};
			app.use(`/bundles/${bundle.name}/*`, transformMiddleware(opts));
		}
	}

	log.trace(`Attempting to listen on ${config.host}:${config.port}`);

	yield* Effect.forkScoped(
		listenToEvent<[Error]>(server, "error").pipe(
			Effect.andThen(
				Stream.runForEach(([err]) =>
					Effect.sync(() => {
						if ((err as NodeJS.ErrnoException).code === "EADDRINUSE") {
							// There is a separate handling in NODECG_TEST
							if (!process.env.NODECG_TEST) {
								log.error(
									`Listen ${config.host}:${config.port} in use, is NodeCG already running? NodeCG will now exit.`,
								);
							}
						} else {
							log.error("Unhandled error!", err);
						}
					}),
				),
			),
		),
	);

	if (sentryEnabled) {
		const sentryApp = yield* sentryConfigRouter(bundleManager);
		app.use(sentryApp);
	}

	const persistedReplicantEntities = yield* Effect.promise(async () => {
		const replicants = await databaseAdapter.getAllReplicants();
		return replicants;
	});

	const replicator = yield* Effect.acquireRelease(
		Effect.sync(
			() => new Replicator(io, databaseAdapter, persistedReplicantEntities),
		),
		(replicator) => Effect.sync(() => replicator.saveAllReplicants()),
	);

	const graphicsRoute = yield* graphicsRouter(io, bundleManager, replicator);
	app.use(graphicsRoute);

	const dashboardRoute = yield* dashboardRouter(bundleManager);
	app.use(dashboardRoute);

	const mounts = yield* mountsRouter(bundleManager);
	app.use(mounts);

	const sounds = yield* soundsRouter(bundleManager, replicator);
	app.use(sounds);

	const assets = yield* assetsRouter(bundleManager, replicator);
	app.use("/assets", assets);

	const sharedSources = yield* sharedSourceRouter(bundleManager);
	app.use(sharedSources);

	if (sentryEnabled) {
		app.use(Sentry.Handlers.errorHandler());
	}

	// Fallthrough error handler,
	// Taken from https://docs.sentry.io/platforms/node/express/
	app.use(
		(
			err: unknown,
			_req: express.Request,
			res: express.Response,
			_next: express.NextFunction,
		) => {
			res.statusCode = 500;
			if (sentryEnabled) {
				// The error id is attached to `res.sentry` to be returned
				// and optionally displayed to the user for support.
				res.end(
					`Internal error\nSentry issue ID: ${String((res as any).sentry)}\n`,
				);
			} else {
				res.end("Internal error");
			}

			log.error(err);
		},
	);

	// Set up "bundles" Replicant.
	const bundlesReplicant = replicator.declare("bundles", "nodecg", {
		schemaPath: path.join(
			rootPaths.nodecgInstalledPath,
			"schemas/bundles.json",
		),
		persistent: false,
	});
	const updateBundlesReplicant = () => {
		bundlesReplicant.value = clone(bundleManager.all());
	};
	const bundleManagerEvents = yield* Effect.all(
		[
			listenToEvent<[]>(bundleManager, "ready"),
			listenToEvent<[]>(bundleManager, "bundleChanged"),
			listenToEvent<[]>(bundleManager, "gitChanged"),
			listenToEvent<[]>(bundleManager, "bundleRemoved"),
		],
		{ concurrency: "unbounded" },
	).pipe(
		Effect.andThen(Stream.mergeAll({ concurrency: "unbounded" })),
		Effect.andThen(Stream.debounce("100 millis")),
	);
	yield* Effect.forkScoped(
		Stream.runForEach(bundleManagerEvents, () =>
			Effect.sync(updateBundlesReplicant),
		),
	);
	updateBundlesReplicant();

	const mount = (...args: any[]) => app.use(...args);
	const extensionManager = yield* Effect.acquireRelease(
		Effect.sync(
			() => new ExtensionManager(io, bundleManager, replicator, mount),
		),
		(extensionManager) =>
			Effect.sync(() => extensionManager.emitToAllInstances("serverStopping")),
	);
	extensionManager.emitToAllInstances("extensionsLoaded");

	const runtime = yield* Effect.runtime();

	const run = Effect.fn(function* () {
		server.listen(
			{
				host: config.host,
				port: process.env.NODECG_TEST ? undefined : config.port,
			},
			() =>
				Runtime.runSync(
					runtime,
					Effect.gen(function* () {
						if (process.env.NODECG_TEST) {
							const addrInfo = server.address();
							if (typeof addrInfo !== "object" || addrInfo === null) {
								throw new Error("couldn't get port number");
							}

							const { port } = addrInfo;
							log.warn(
								`Test mode active, using automatic listen port: ${port}`,
							);
							config.port = port;
							filteredConfig.port = port;
							process.env.NODECG_TEST_PORT = String(port);
						}

						const protocol = config.ssl?.enabled ? "https" : "http";
						log.info("NodeCG running on %s://%s", protocol, config.baseURL);
						if (isReady) {
							yield* Deferred.succeed(isReady, undefined);
						}
						extensionManager.emitToAllInstances("serverStarted");
					}),
				),
		);
		return yield* Effect.raceFirst(waitForError, waitForClose);
	});

	return {
		run,
		getExtensions: () => ({ ...extensionManager.extensions }),
		saveAllReplicantsNow: () => replicator.saveAllReplicantsNow(),
		bundleManager,
	};
});

export class FileWatcherReadyTimeoutError extends Data.TaggedError(
	"FileWatcherReadyTimeoutError",
) {
	override readonly message = "Timed out waiting for file watcher to be ready";
}
