"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCGServer = void 0;
// Minimal imports for first setup
require("../util/sentry-config");
const Sentry = __importStar(require("@sentry/node"));
const os = __importStar(require("os"));
const config_1 = require("../config");
const nodecg_package_json_1 = require("../util/nodecg-package-json");
if (config_1.config.sentry?.enabled) {
    Sentry.init({
        dsn: config_1.config.sentry.dsn,
        serverName: os.hostname(),
        release: nodecg_package_json_1.nodecgPackageJson.version,
    });
    Sentry.configureScope((scope) => {
        scope.setTags({
            nodecgHost: config_1.config.host,
            nodecgBaseURL: config_1.config.baseURL,
        });
    });
    process.on("unhandledRejection", (reason, p) => {
        console.error("Unhandled Rejection at:", p, "reason:", reason);
        Sentry.captureException(reason);
    });
    console.info("[nodecg] Sentry enabled.");
}
const fs = require("fs");
const path = require("path");
const database_adapter_sqlite_legacy_1 = require("@nodecg/database-adapter-sqlite-legacy");
const internal_util_1 = require("@nodecg/internal-util");
const body_parser_1 = __importDefault(require("body-parser"));
const compression_1 = __importDefault(require("compression"));
const express_1 = __importDefault(require("express"));
const express_transform_bare_module_specifiers_1 = __importDefault(require("express-transform-bare-module-specifiers"));
const fast_memoize_1 = __importDefault(require("fast-memoize"));
const json_1 = require("klona/json");
const lodash_1 = require("lodash");
const passport_1 = __importDefault(require("passport"));
const SocketIO = __importStar(require("socket.io"));
const typed_emitter_1 = require("../../shared/typed-emitter");
const assets_1 = require("../assets");
const bundle_manager_1 = require("../bundle-manager");
const dashboard_1 = require("../dashboard");
const graphics_1 = require("../graphics");
const logger_1 = require("../logger");
const socketAuthMiddleware_1 = require("../login/socketAuthMiddleware");
const mounts_1 = require("../mounts");
const replicator_1 = require("../replicant/replicator");
const shared_sources_1 = require("../shared-sources");
const sounds_1 = require("../sounds");
const sentry_config_1 = require("../util/sentry-config");
const extensions_1 = require("./extensions");
const socketApiMiddleware_1 = require("./socketApiMiddleware");
const renderTemplate = (0, fast_memoize_1.default)((content, options) => (0, lodash_1.template)(content)(options));
class NodeCGServer extends typed_emitter_1.TypedEmitter {
    log = (0, logger_1.createLogger)("server");
    _io;
    _app = (0, express_1.default)();
    _server;
    _replicator;
    _extensionManager;
    /**
     * Only used by tests. Gross hack.
     */
    // @ts-expect-error Used only by tests.
    _bundleManager;
    constructor() {
        super();
        this.mount = this.mount.bind(this);
        /**
         * HTTP(S) server setup
         */
        const { _app: app } = this;
        let server;
        if (config_1.config.ssl.enabled &&
            config_1.config.ssl.keyPath &&
            config_1.config.ssl.certificatePath) {
            const sslOpts = {
                key: fs.readFileSync(config_1.config.ssl.keyPath),
                cert: fs.readFileSync(config_1.config.ssl.certificatePath),
            };
            if (config_1.config.ssl.passphrase) {
                sslOpts.passphrase = config_1.config.ssl.passphrase;
            }
            // If we allow HTTP on the same port, use httpolyglot
            // otherwise, standard https server
            server = config_1.config.ssl.allowHTTP
                ? require("httpolyglot").createServer(sslOpts, app)
                : require("https").createServer(sslOpts, app);
        }
        else {
            server = require("http").createServer(app);
        }
        /**
         * Socket.IO server setup.
         */
        this._io = new SocketIO.Server(server);
        this._io.setMaxListeners(75); // Prevent console warnings when many extensions are installed
        this._io.on("error", (err) => {
            if (config_1.sentryEnabled) {
                Sentry.captureException(err);
            }
            this.log.error(err.stack);
        });
        this._server = server;
    }
    async start() {
        const { _app: app, _server: server, log } = this;
        const io = this._io.of("/");
        log.info(`Starting NodeCG ${nodecg_package_json_1.nodecgPackageJson.version} (Running on Node.js ${process.version})`);
        if (config_1.sentryEnabled) {
            app.use(Sentry.Handlers.requestHandler());
        }
        // Set up Express
        app.use((0, compression_1.default)());
        app.use(body_parser_1.default.json());
        app.use(body_parser_1.default.urlencoded({ extended: true }));
        app.set("trust proxy", true);
        app.engine("tmpl", (filePath, options, callback) => {
            fs.readFile(filePath, (error, content) => {
                if (error) {
                    return callback(error);
                }
                return callback(null, renderTemplate(content, options));
            });
        });
        const bundlesPaths = [path.join((0, internal_util_1.getNodecgRoot)(), "bundles")].concat(config_1.config.bundles?.paths ?? []);
        const cfgPath = path.join((0, internal_util_1.getNodecgRoot)(), "cfg");
        const bundleManager = new bundle_manager_1.BundleManager(bundlesPaths, cfgPath, nodecg_package_json_1.nodecgPackageJson.version, config_1.config);
        let databaseAdapter = database_adapter_sqlite_legacy_1.databaseAdapter;
        let databaseAdapterExists = false;
        for (const bundle of bundleManager.all()) {
            if (bundle.nodecgBundleConfig.databaseAdapter) {
                log.warn("`databaseAdapter` is an experimental feature and may be changed without major version bump.");
                if (databaseAdapterExists) {
                    throw new Error("Multiple bundles are attempting to set the database adapter.");
                }
                databaseAdapter = bundle.nodecgBundleConfig.databaseAdapter;
                databaseAdapterExists = true;
            }
        }
        this._app.use((_, res, next) => {
            res.locals.databaseAdapter = databaseAdapter;
            next();
        });
        if (config_1.config.login?.enabled) {
            log.info("Login security enabled");
            const login = await Promise.resolve().then(() => __importStar(require("../login")));
            const { app: loginMiddleware, sessionMiddleware } = login.createMiddleware(databaseAdapter, {
                onLogin: (user) => {
                    // If the user had no roles, then that means they "logged in"
                    // with a third-party auth provider but weren't able to
                    // get past the login page because the NodeCG config didn't allow that user.
                    // At this time, we only tell extensions about users that are valid.
                    if (user.roles.length > 0) {
                        this._extensionManager?.emitToAllInstances("login", user);
                    }
                },
                onLogout: (user) => {
                    if (user.roles.length > 0) {
                        this._extensionManager?.emitToAllInstances("logout", user);
                    }
                },
            });
            app.use(loginMiddleware);
            // convert a connect middleware to a Socket.IO middleware
            const wrap = (middleware) => (socket, next) => middleware(socket.request, {}, next);
            io.use(wrap(sessionMiddleware));
            io.use(wrap(passport_1.default.initialize()));
            io.use(wrap(passport_1.default.session()));
            this._io.use((0, socketAuthMiddleware_1.createSocketAuthMiddleware)(databaseAdapter));
        }
        else {
            app.get("/login*", (_, res) => {
                res.redirect("/dashboard");
            });
        }
        this._io.use(socketApiMiddleware_1.socketApiMiddleware);
        // Wait for Chokidar to finish its initial scan.
        await new Promise((resolve, reject) => {
            let handled = false;
            const timeout = setTimeout(() => {
                if (handled)
                    return;
                handled = true;
                reject(new Error("Timed out while waiting for the bundle manager to become ready."));
            }, 15000);
            if (bundleManager.ready) {
                succeed();
            }
            else {
                bundleManager.once("ready", () => {
                    succeed();
                });
            }
            function succeed() {
                if (handled)
                    return;
                handled = true;
                clearTimeout(timeout);
                resolve();
            }
        });
        bundleManager.all().forEach((bundle) => {
            // TODO: remove this feature in v3
            if (bundle.transformBareModuleSpecifiers) {
                log.warn(`${bundle.name} uses the deprecated "transformBareModuleSpecifiers" feature. ` +
                    "This feature will be removed in NodeCG v3. " +
                    "Please migrate to using browser-native import maps instead: " +
                    "https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap");
                const opts = {
                    rootDir: (0, internal_util_1.getNodecgRoot)(),
                    modulesUrl: `/bundles/${bundle.name}/node_modules`,
                };
                app.use(`/bundles/${bundle.name}/*`, (0, express_transform_bare_module_specifiers_1.default)(opts));
            }
        });
        // Only used by tests. Kinda gross. Sorry.
        this._bundleManager = bundleManager;
        log.trace(`Attempting to listen on ${config_1.config.host}:${config_1.config.port}`);
        server.on("error", (err) => {
            switch (err.code) {
                case "EADDRINUSE":
                    if (process.env.NODECG_TEST) {
                        return;
                    }
                    log.error(`Listen ${config_1.config.host}:${config_1.config.port} in use, is NodeCG already running? NodeCG will now exit.`);
                    break;
                default:
                    log.error("Unhandled error!", err);
                    break;
            }
            this.emit("error", err);
        });
        if (config_1.sentryEnabled) {
            const sentryHelpers = new sentry_config_1.SentryConfig(bundleManager);
            app.use(sentryHelpers.app);
        }
        const persistedReplicantEntities = await databaseAdapter.getAllReplicants();
        const replicator = new replicator_1.Replicator(io, databaseAdapter, persistedReplicantEntities);
        this._replicator = replicator;
        const graphics = new graphics_1.GraphicsLib(io, bundleManager, replicator);
        app.use(graphics.app);
        const dashboard = new dashboard_1.DashboardLib(bundleManager);
        app.use(dashboard.app);
        const mounts = new mounts_1.MountsLib(bundleManager.all());
        app.use(mounts.app);
        const sounds = new sounds_1.SoundsLib(bundleManager.all(), replicator);
        app.use(sounds.app);
        const assets = (0, assets_1.createAssetsMiddleware)(bundleManager.all(), replicator);
        app.use("/assets", assets);
        const sharedSources = new shared_sources_1.SharedSourcesLib(bundleManager.all());
        app.use(sharedSources.app);
        if (config_1.sentryEnabled) {
            app.use(Sentry.Handlers.errorHandler());
        }
        // Fallthrough error handler,
        // Taken from https://docs.sentry.io/platforms/node/express/
        app.use((err, _req, res, _next) => {
            res.statusCode = 500;
            if (config_1.sentryEnabled) {
                // The error id is attached to `res.sentry` to be returned
                // and optionally displayed to the user for support.
                res.end(`Internal error\nSentry issue ID: ${String(res.sentry)}\n`);
            }
            else {
                res.end("Internal error");
            }
            this.log.error(err);
        });
        // Set up "bundles" Replicant.
        const bundlesReplicant = replicator.declare("bundles", "nodecg", {
            schemaPath: path.resolve(internal_util_1.nodecgPath, "schemas/bundles.json"),
            persistent: false,
        });
        const updateBundlesReplicant = (0, lodash_1.debounce)(() => {
            bundlesReplicant.value = (0, json_1.klona)(bundleManager.all());
        }, 100);
        bundleManager.on("ready", updateBundlesReplicant);
        bundleManager.on("bundleChanged", updateBundlesReplicant);
        bundleManager.on("gitChanged", updateBundlesReplicant);
        bundleManager.on("bundleRemoved", updateBundlesReplicant);
        updateBundlesReplicant();
        const extensionManager = new extensions_1.ExtensionManager(io, bundleManager, replicator, this.mount);
        this._extensionManager = extensionManager;
        this.emit("extensionsLoaded");
        this._extensionManager?.emitToAllInstances("extensionsLoaded");
        // We intentionally wait until all bundles and extensions are loaded before starting the server.
        // This has two benefits:
        // 1) Prevents the dashboard/views from being opened before everything has finished loading
        // 2) Prevents dashboard/views from re-declaring replicants on reconnect before extensions have had a chance
        return new Promise((resolve) => {
            server.listen({
                host: config_1.config.host,
                port: process.env.NODECG_TEST ? undefined : config_1.config.port,
            }, () => {
                if (process.env.NODECG_TEST) {
                    const addrInfo = server.address();
                    if (typeof addrInfo !== "object" || addrInfo === null) {
                        throw new Error("couldn't get port number");
                    }
                    const { port } = addrInfo;
                    log.warn(`Test mode active, using automatic listen port: ${port}`);
                    config_1.config.port = port;
                    config_1.filteredConfig.port = port;
                    process.env.NODECG_TEST_PORT = String(port);
                }
                const protocol = config_1.config.ssl?.enabled ? "https" : "http";
                log.info("NodeCG running on %s://%s", protocol, config_1.config.baseURL);
                this.emit("started");
                this._extensionManager?.emitToAllInstances("serverStarted");
                resolve();
            });
        });
    }
    async stop() {
        this._extensionManager?.emitToAllInstances("serverStopping");
        this._io.disconnectSockets(true);
        await new Promise((resolve) => {
            // Also closes the underlying HTTP server.
            void this._io.close(() => {
                resolve();
            });
        });
        if (this._replicator) {
            this._replicator.saveAllReplicants();
        }
        this.emit("stopped");
    }
    getExtensions() {
        return { ...this._extensionManager?.extensions };
    }
    getSocketIOServer() {
        return this._io;
    }
    mount = (...args) => this._app.use(...args);
    async saveAllReplicantsNow() {
        return this._replicator?.saveAllReplicantsNow();
    }
}
exports.NodeCGServer = NodeCGServer;
//# sourceMappingURL=index.js.map