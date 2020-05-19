// Native
import * as path from 'path';
import { format, inspect } from 'util';

// Packages
import * as fs from 'fs-extra';
import winston from 'winston';
import * as Sentry from '@sentry/node';

// Ours
import { LoggerInterface, LogLevel } from '../../shared/logger-interface';

type LoggerOptions = {
	console: Partial<{
		enabled: boolean;
		level: LogLevel;
	}>;
	file: Partial<{
		enabled: boolean;
		level: LogLevel;
		path: string;
	}>;
	replicants: boolean;
};

/**
 * A factory that configures and returns a Logger constructor.
 *
 * @returns A constructor used to create discrete logger instances.
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export default function(initialOpts: Partial<LoggerOptions> = {}, sentry: typeof Sentry | undefined = undefined) {
	initialOpts = initialOpts || {};
	initialOpts.console = initialOpts.console ?? {};
	initialOpts.file = initialOpts.file ?? {};
	initialOpts.file.path = initialOpts.file.path ?? 'logs/nodecg.log';

	const consoleTransport = new winston.transports.Console({
		name: 'nodecgConsole',
		prettyPrint: true,
		colorize: true,
		level: initialOpts.console.level ?? LogLevel.Info,
		silent: !initialOpts.console.enabled,
		stderrLevels: ['warn', 'error'],
	});

	const fileTransport = new winston.transports.File({
		name: 'nodecgFile',
		json: false,
		prettyPrint: true,
		filename: initialOpts.file.path,
		level: initialOpts.file.level ?? LogLevel.Info,
		silent: !initialOpts.file.enabled,
	});

	if (typeof initialOpts.file.path !== 'undefined') {
		// TODO: I think this typedef is wrong. Re-evaluate after upgrading to Winston 3.
		(fileTransport as any).filename = initialOpts.file.path;

		// Make logs folder if it does not exist.
		if (!fs.existsSync(path.dirname(initialOpts.file.path))) {
			fs.mkdirpSync(path.dirname(initialOpts.file.path));
		}
	}

	winston.addColors({
		verbose: 'green',
		debug: 'cyan',
		info: 'white',
		warn: 'yellow',
		error: 'red',
	});

	const mainLogger = new winston.Logger({
		transports: [consoleTransport, fileTransport],
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
		static readonly _winston = mainLogger;

		// A messy bit of internal state used to determine if the special-case "replicants" logging level is active.
		static _shouldLogReplicants = Boolean(initialOpts.replicants);

		name: string;

		constructor(name: string) {
			this.name = name;
		}

		trace(...args: any[]): void {
			mainLogger.verbose(`[${this.name}]`, format(args[0], ...args.slice(1)));
		}

		debug(...args: any[]): void {
			mainLogger.debug(`[${this.name}]`, format(args[0], ...args.slice(1)));
		}

		info(...args: any[]): void {
			mainLogger.info(`[${this.name}]`, format(args[0], ...args.slice(1)));
		}

		warn(...args: any[]): void {
			mainLogger.warn(`[${this.name}]`, format(args[0], ...args.slice(1)));
		}

		error(...args: any[]): void {
			mainLogger.error(`[${this.name}]`, format(args[0], ...args.slice(1)));

			if (sentry) {
				const formattedArgs = args.map(argument => {
					return typeof argument === 'object'
						? inspect(argument, { depth: null, showProxy: true })
						: argument;
				});

				sentry.captureException(
					new Error(`[${this.name}] ` + format(formattedArgs[0], ...formattedArgs.slice(1))),
				);
			}
		}

		replicants(...args: any[]): void {
			if (!Logger._shouldLogReplicants) {
				return;
			}

			mainLogger.info(`[${this.name}]`, format(args[0], ...args.slice(1)));
		}
	};
}
