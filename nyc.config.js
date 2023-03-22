module.exports = {
	/**
	 * Start with the official TS config as a base.
	 */
	extends: '@istanbuljs/nyc-config-typescript',

	/**
	 * Ensure all files are considered for coverage, even if the file isn't used.
	 * This helps catch unused/untested files.
	 */
	all: true,

	/**
	 * Ensure that the contents of the build dir are never considered for instrumentation and coverage.
	 */
	exclude: ['build/**'],

	/**
	 * When using nyc from the command line, only instrument the server files.
	 * The client files are instrumented separately during their webpack build.
	 *
	 * Note that this will also exclude `src/client` from the coverage _report_ too,
	 * so our npm scripts sometimes override this setting when running reports.
	 */
	include: ['src/server/**'],
};
