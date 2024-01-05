import { format, inspect } from 'util';
import type * as Sentry from '@sentry/browser';
import type { LoggerInterface } from '../../../types/logger-interface';
import { LogLevel } from '../../../types/logger-interface';

const OrderedLogLevels: { [Level in LogLevel]: number } = {
	verbose: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4,
	silent: 5,
};

type LoggerOptions = {
	console: {
		enabled: boolean;
		level?: LogLevel;
		replicants?: boolean;
	};
};

/**
 * A factory that configures and returns a Logger constructor.
 *
 * @returns  A constructor used to create discrete logger instances.
 */

export default function (initialOpts: Partial<LoggerOptions> = {}, sentry: typeof Sentry | undefined = undefined) {
	/**
	 * Constructs a new Logger instance that prefixes all output with the given name.
	 * @param name {String} - The label to prefix all output of this logger with.
	 * @returns {Object} - A Logger instance.
	 * @constructor
	 */
	return class Logger implements LoggerInterface {
		// A messy bit of internal state used to determine if the special-case "replicants" logging level is active.
		static _shouldLogReplicants = Boolean(initialOpts.console?.replicants);

		static _silent = !initialOpts.console?.enabled;

		static _level: LogLevel = initialOpts.console?.level ?? LogLevel.Info;

		constructor(public name: string) {
			this.name = name;
		}

		trace(...args: any[]): void {
			if (Logger._silent) {
				return;
			}

			if (OrderedLogLevels[Logger._level] > OrderedLogLevels.verbose) {
				return;
			}

			console.info(`[${this.name}]`, ...args);
		}

		debug(...args: any[]): void {
			if (Logger._silent) {
				return;
			}

			if (OrderedLogLevels[Logger._level] > OrderedLogLevels.debug) {
				return;
			}

			console.info(`[${this.name}]`, ...args);
		}

		info(...args: any[]): void {
			if (Logger._silent) {
				return;
			}

			if (OrderedLogLevels[Logger._level] > OrderedLogLevels.info) {
				return;
			}

			console.info(`[${this.name}]`, ...args);
		}

		warn(...args: any[]): void {
			if (Logger._silent) {
				return;
			}

			if (OrderedLogLevels[Logger._level] > OrderedLogLevels.warn) {
				return;
			}

			console.warn(`[${this.name}]`, ...args);
		}

		error(...args: any[]): void {
			if (Logger._silent) {
				return;
			}

			if (OrderedLogLevels[Logger._level] > OrderedLogLevels.error) {
				return;
			}

			console.error(`[${this.name}]`, ...args);

			if (sentry) {
				const formattedArgs = args.map((argument) =>
					typeof argument === 'object' ? inspect(argument, { depth: null, showProxy: true }) : argument,
				);

				sentry.captureException(new Error(`[${this.name}] ` + format(formattedArgs[0], ...formattedArgs.slice(1))));
			}
		}

		replicants(...args: any[]): void {
			if (Logger._silent) {
				return;
			}

			if (!Logger._shouldLogReplicants) {
				return;
			}

			console.info(`[${this.name}]`, ...args);
		}
	};
}
