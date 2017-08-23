'use strict';

const path = require('path');
const {format, inspect} = require('util');
const fs = require('fs.extra');
const winston = require('winston');

/**
 * Enum logging level values.
 * @enum {String}
 */
const ENUM_LEVELS = { // eslint-disable-line no-unused-vars
	trace: 'The highest level of logging, logs everything.',
	debug: 'Less spammy than trace, includes most info relevant for debugging.',
	info: 'The default logging level. Logs useful info, warnings, and errors.',
	warn: 'Only logs warnings and errors.',
	error: 'Only logs errors.'
};

/**
 * A factory that configures and returns a Logger constructor.
 * @param [initialOpts] {Object} - Configuration for the logger.
 *
 * @param [initialOpts.console] {Object} - Configuration for the console logging.
 * @param [initialOpts.console.enabled=false] {Boolean} - Whether to enable console logging.
 * @param [initialOpts.console.level="info"] {ENUM_LEVELS} - The level of logging to output to the console.
 *
 * @param [initialOpts.file] {Object} - Configuration for file logging.
 * @param initialOpts.file.path {String} - Where the log file should be saved.
 * @param [initialOpts.file.enabled=false] {Boolean} - Whether to enable file logging.
 * @param [initialOpts.file.level="info"] {ENUM_LEVELS} - The level of logging to output to file.
 *
 * @param [initialOpts.replicants=false] {Boolean} - Whether to enable logging specifically for the Replicants system.
 *
 * @param [Raven] {Object} - A pre-configured server-side Raven npm package instance, for reporting errors to Sentry.io
 *
 * @returns {function} - A constructor used to create discrete logger instances.
 */
module.exports = function (initialOpts, Raven) {
	initialOpts = initialOpts || {};
	initialOpts.console = initialOpts.console || {};
	initialOpts.file = initialOpts.file || {};
	initialOpts.file.path = initialOpts.file.path || 'logs/nodecg.log';

	const consoleTransport = new winston.transports.Console({
		name: 'nodecgConsole',
		prettyPrint: true,
		colorize: true,
		level: initialOpts.console.level || 'info',
		silent: !initialOpts.console.enabled,
		stderrLevels: ['warn', 'error']
	});

	const fileTransport = new winston.transports.File({
		name: 'nodecgFile',
		json: false,
		prettyPrint: true,
		filename: initialOpts.file.path,
		level: initialOpts.file.level || 'info',
		silent: !initialOpts.file.enabled
	});

	winston.addColors({
		trace: 'green',
		debug: 'cyan',
		info: 'white',
		warn: 'yellow',
		error: 'red'
	});

	const mainLogger = new (winston.Logger)({
		transports: [consoleTransport, fileTransport],
		levels: {
			trace: 4,
			debug: 3,
			info: 2,
			warn: 1,
			error: 0
		}
	});

	/**
	 * Constructs a new Logger instance that prefixes all output with the given name.
	 * @param name {String} - The label to prefix all output of this logger with.
	 * @returns {Object} - A Logger instance.
	 * @constructor
	 */
	class Logger {
		constructor(name) {
			this.name = name;
		}

		trace() {
			const args = Array.from(arguments);
			mainLogger.trace(`[${this.name}] ${args[0]}`, ...args.slice(1));
		}

		debug() {
			const args = Array.from(arguments);
			mainLogger.debug(`[${this.name}] ${args[0]}`, ...args.slice(1));
		}

		info() {
			const args = Array.from(arguments);
			mainLogger.info(`[${this.name}] ${args[0]}`, ...args.slice(1));
		}

		warn() {
			const args = Array.from(arguments);
			mainLogger.warn(`[${this.name}] ${args[0]}`, ...args.slice(1));
		}

		error() {
			const args = Array.from(arguments);
			mainLogger.error(`[${this.name}] ${args[0]}`, ...args.slice(1));

			if (Raven) {
				const formattedArgs = Array.from(arguments).map(argument => {
					return typeof argument === 'object' ?
						inspect(argument, {depth: null, showProxy: true}) :
						argument;
				});

				Raven.captureException(new Error(format(`[${this.name}]`, ...formattedArgs)), {
					logger: 'server @nodecg/logger'
				});
			}
		}

		replicants() {
			if (!Logger._shouldLogReplicants) {
				return;
			}

			const args = Array.from(arguments);
			mainLogger.info(`[${this.name}] ${args[0]}`, ...args.slice(1));
		}

		static globalReconfigure(opts) {
			_configure(opts);
		}
	}

	Logger._winston = mainLogger;

	// A messy bit of internal state used to determine if the special-case "replicants" logging level is active.
	Logger._shouldLogReplicants = Boolean(initialOpts.replicants);

	_configure(initialOpts);

	function _configure(opts) {
		// Initialize opts with empty objects, if nothing was provided.
		opts = opts || {};
		opts.console = opts.console || {};
		opts.file = opts.file || {};

		if (typeof opts.console.enabled !== 'undefined') {
			consoleTransport.silent = !opts.console.enabled;
		}

		if (typeof opts.console.level !== 'undefined') {
			consoleTransport.level = opts.console.level;
		}

		if (typeof opts.file.enabled !== 'undefined') {
			fileTransport.silent = !opts.file.enabled;
		}

		if (typeof opts.file.level !== 'undefined') {
			fileTransport.level = opts.file.level;
		}

		if (typeof opts.file.path !== 'undefined') {
			fileTransport.filename = opts.file.path;

			// Make logs folder if it does not exist.
			if (!fs.existsSync(path.dirname(opts.file.path))) {
				fs.mkdirpSync(path.dirname(opts.file.path));
			}
		}

		if (typeof opts.replicants !== 'undefined') {
			Logger._shouldLogReplicants = opts.replicants;
		}
	}

	return Logger;
};
