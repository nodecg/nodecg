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
exports.loggerFactory = loggerFactory;
const node_fs_1 = __importDefault(require("node:fs"));
const path = __importStar(require("node:path"));
const node_util_1 = require("node:util");
const winston_1 = __importDefault(require("winston"));
const logger_interface_1 = require("../../types/logger-interface");
/**
 * A factory that configures and returns a Logger constructor.
 *
 * @returns A constructor used to create discrete logger instances.
 */
function loggerFactory(initialOpts = {}, sentry = undefined) {
    initialOpts = initialOpts || {};
    initialOpts.console = initialOpts.console ?? {};
    initialOpts.file = initialOpts.file ?? {};
    initialOpts.file.path = initialOpts.file.path ?? "logs/nodecg.log";
    const consoleTransport = new winston_1.default.transports.Console({
        level: initialOpts.console.level ?? logger_interface_1.LogLevel.Info,
        silent: !initialOpts.console.enabled,
        stderrLevels: ["warn", "error"],
        format: winston_1.default.format.combine(winston_1.default.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Format local time for console.
        winston_1.default.format.errors({ stack: true }), winston_1.default.format.colorize(), winston_1.default.format.printf((info) => `${initialOpts?.console?.timestamps ? `${info["timestamp"]} - ` : ""}${info.level}: ${info.message}`)),
    });
    const fileTransport = new winston_1.default.transports.File({
        filename: initialOpts.file.path,
        level: initialOpts.file.level ?? logger_interface_1.LogLevel.Info,
        silent: !initialOpts.file.enabled,
        format: winston_1.default.format.combine(winston_1.default.format.timestamp(), // Leave formatting as ISO 8601 UTC for file.
        winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf((info) => `${initialOpts?.file?.timestamps ? `${info["timestamp"]} - ` : ""}${info.level}: ${info.message}`)),
    });
    if (typeof initialOpts.file.path !== "undefined") {
        fileTransport.filename = initialOpts.file.path;
        // Make logs folder if it does not exist.
        if (!node_fs_1.default.existsSync(path.dirname(initialOpts.file.path))) {
            node_fs_1.default.mkdirSync(path.dirname(initialOpts.file.path), { recursive: true });
        }
    }
    winston_1.default.addColors({
        verbose: "green",
        debug: "cyan",
        info: "white",
        warn: "yellow",
        error: "red",
    });
    const consoleLogger = winston_1.default.createLogger({
        transports: [consoleTransport],
        levels: {
            verbose: 4,
            trace: 4,
            debug: 3,
            info: 2,
            warn: 1,
            error: 0,
        },
    });
    const fileLogger = winston_1.default.createLogger({
        transports: [fileTransport],
        levels: {
            verbose: 4,
            trace: 4,
            debug: 3,
            info: 2,
            warn: 1,
            error: 0,
        },
    });
    /**
     * Constructs a new Logger instance that prefixes all output with the given name.
     * @param name {String} - The label to prefix all output of this logger with.
     * @returns {Object} - A Logger instance.
     * @constructor
     */
    return class Logger {
        name;
        static _consoleLogger = consoleLogger;
        static _fileLogger = fileLogger;
        // A messy bit of internal state used to determine if the special-case "replicants" logging level is active.
        static _shouldConsoleLogReplicants = Boolean(initialOpts.console?.replicants);
        static _shouldFileLogReplicants = Boolean(initialOpts.file?.replicants);
        constructor(name) {
            this.name = name;
            this.name = name;
        }
        trace(...args) {
            [consoleLogger, fileLogger].forEach((logger) => logger.verbose(`[${this.name}] ${(0, node_util_1.format)(args[0], ...args.slice(1))}`));
        }
        debug(...args) {
            [consoleLogger, fileLogger].forEach((logger) => logger.debug(`[${this.name}] ${(0, node_util_1.format)(args[0], ...args.slice(1))}`));
        }
        info(...args) {
            [consoleLogger, fileLogger].forEach((logger) => logger.info(`[${this.name}] ${(0, node_util_1.format)(args[0], ...args.slice(1))}`));
        }
        warn(...args) {
            [consoleLogger, fileLogger].forEach((logger) => logger.warn(`[${this.name}] ${(0, node_util_1.format)(args[0], ...args.slice(1))}`));
        }
        error(...args) {
            [consoleLogger, fileLogger].forEach((logger) => logger.error(`[${this.name}] ${(0, node_util_1.format)(args[0], ...args.slice(1))}`));
            if (sentry) {
                const formattedArgs = args.map((argument) => typeof argument === "object"
                    ? (0, node_util_1.inspect)(argument, { depth: null, showProxy: true })
                    : argument);
                sentry.captureException(new Error(`[${this.name}] ` +
                    (0, node_util_1.format)(formattedArgs[0], ...formattedArgs.slice(1))));
            }
        }
        replicants(...args) {
            if (Logger._shouldConsoleLogReplicants) {
                consoleLogger.info(`[${this.name}] ${(0, node_util_1.format)(args[0], ...args.slice(1))}`);
            }
            if (Logger._shouldFileLogReplicants) {
                fileLogger.info(`[${this.name}] ${(0, node_util_1.format)(args[0], ...args.slice(1))}`);
            }
        }
    };
}
//# sourceMappingURL=logger.server.js.map