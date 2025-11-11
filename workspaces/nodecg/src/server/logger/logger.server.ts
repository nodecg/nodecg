import fs from "node:fs";
import * as path from "node:path";
import { format, inspect } from "node:util";

import type * as Sentry from "@sentry/node";
import winston from "winston";

import type { LoggerInterface } from "../../types/logger-interface";
import { LogLevel } from "../../types/logger-interface";

interface LoggerOptions {
	console: Partial<{
		enabled: boolean;
		timestamps: boolean;
		level: LogLevel;
		replicants: boolean;
	}>;
	file: Partial<{
		enabled: boolean;
		timestamps: boolean;
		level: LogLevel;
		path: string;
		replicants: boolean;
	}>;
}

/**
 * A factory that configures and returns a Logger constructor.
 *
 * @returns A constructor used to create discrete logger instances.
 */
export function loggerFactory(
	initialOpts: Partial<LoggerOptions> = {},
	sentry: typeof Sentry | undefined = undefined,
) {
	initialOpts = initialOpts || {};
	initialOpts.console = initialOpts.console ?? {};
	initialOpts.file = initialOpts.file ?? {};
	initialOpts.file.path = initialOpts.file.path ?? "logs/nodecg.log";

	const consoleTransport = new winston.transports.Console({
		level: initialOpts.console.level ?? LogLevel.Info,
		silent: !initialOpts.console.enabled,
		stderrLevels: ["warn", "error"],
		format: winston.format.combine(
			winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), // Format local time for console.
			winston.format.errors({ stack: true }),
			winston.format.colorize(),
			winston.format.printf(
				(info) =>
					`${initialOpts?.console?.timestamps ? `${info.timestamp} - ` : ""}${info.level}: ${info.message}`,
			),
		),
	});

	const fileTransport = new winston.transports.File({
		filename: initialOpts.file.path,
		level: initialOpts.file.level ?? LogLevel.Info,
		silent: !initialOpts.file.enabled,
		format: winston.format.combine(
			winston.format.timestamp(), // Leave formatting as ISO 8601 UTC for file.
			winston.format.errors({ stack: true }),
			winston.format.printf(
				(info) =>
					`${initialOpts?.file?.timestamps ? `${info.timestamp} - ` : ""}${info.level}: ${info.message}`,
			),
		),
	});

	if (typeof initialOpts.file.path !== "undefined") {
		fileTransport.filename = initialOpts.file.path;

		// Make logs folder if it does not exist.
		if (!fs.existsSync(path.dirname(initialOpts.file.path))) {
			fs.mkdirSync(path.dirname(initialOpts.file.path), { recursive: true });
		}
	}

	winston.addColors({
		verbose: "green",
		debug: "cyan",
		info: "white",
		warn: "yellow",
		error: "red",
	});

	const consoleLogger = winston.createLogger({
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

	const fileLogger = winston.createLogger({
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
	return class Logger implements LoggerInterface {
		static readonly _consoleLogger = consoleLogger;
		static readonly _fileLogger = fileLogger;

		// A messy bit of internal state used to determine if the special-case "replicants" logging level is active.
		static _shouldConsoleLogReplicants = Boolean(
			initialOpts.console?.replicants,
		);
		static _shouldFileLogReplicants = Boolean(initialOpts.file?.replicants);

		constructor(public name: string) {
			this.name = name;
		}

		trace(...args: any[]): void {
			[consoleLogger, fileLogger].forEach((logger) =>
				logger.verbose(`[${this.name}] ${format(args[0], ...args.slice(1))}`),
			);
		}

		debug(...args: any[]): void {
			[consoleLogger, fileLogger].forEach((logger) =>
				logger.debug(`[${this.name}] ${format(args[0], ...args.slice(1))}`),
			);
		}

		info(...args: any[]): void {
			[consoleLogger, fileLogger].forEach((logger) =>
				logger.info(`[${this.name}] ${format(args[0], ...args.slice(1))}`),
			);
		}

		warn(...args: any[]): void {
			[consoleLogger, fileLogger].forEach((logger) =>
				logger.warn(`[${this.name}] ${format(args[0], ...args.slice(1))}`),
			);
		}

		error(...args: any[]): void {
			[consoleLogger, fileLogger].forEach((logger) =>
				logger.error(`[${this.name}] ${format(args[0], ...args.slice(1))}`),
			);

			if (sentry) {
				const formattedArgs = args.map((argument) =>
					typeof argument === "object"
						? inspect(argument, { depth: null, showProxy: true })
						: argument,
				);

				sentry.captureException(
					new Error(
						`[${this.name}] ` +
							format(formattedArgs[0], ...formattedArgs.slice(1)),
					),
				);
			}
		}

		replicants(...args: any[]): void {
			if (Logger._shouldConsoleLogReplicants) {
				consoleLogger.info(
					`[${this.name}] ${format(args[0], ...args.slice(1))}`,
				);
			}

			if (Logger._shouldFileLogReplicants) {
				fileLogger.info(`[${this.name}] ${format(args[0], ...args.slice(1))}`);
			}
		}
	};
}
