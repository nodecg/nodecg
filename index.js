'use strict';

process.title = 'NodeCG';
global.exitOnUncaught = true;

const path = require('path');
const cwd = process.cwd();
global.isZeitPkg = isZeitPkg();

/**
 * Lange: As of July 2019, the only way I know to programmatically
 * determine if code is running inside a Zeit pkg is to check if
 * the first directory in the __dirname is called `snapshot`.
 *
 * There's definitely a possibility for false positives here,
 * but I have yet to find a better alternative.
 */
function isZeitPkg() {
	const parts = __dirname.split(path.sep);
	return parts[1].toLowerCase() === 'snapshot';
}

if (global.isZeitPkg) {
	console.info('[nodecg] Detected that NodeCG is running inside a ZEIT pkg (https://github.com/zeit/pkg)');
} else if (cwd !== __dirname) {
	console.warn('[nodecg] process.cwd is %s, expected %s', cwd, __dirname);
	process.chdir(__dirname);
	console.info('[nodecg] Changed process.cwd to %s', __dirname);
}

if (!process.env.NODECG_ROOT) {
	process.env.NODECG_ROOT = process.cwd();
}

const semver = require('semver');
const exitHook = require('exit-hook');
const {engines} = require('./package.json');
const nodeVersion = process.versions.node;

if (!semver.satisfies(nodeVersion, engines.node)) {
	console.error(`ERROR: NodeCG requires Node.js ${engines.node}`);
	console.error(`       Your Node.js version: v${nodeVersion}`);
	process.exit(1);
}

process.on('uncaughtException', err => {
	if (!global.sentryEnabled) {
		if (global.exitOnUncaught) {
			console.error('UNCAUGHT EXCEPTION! NodeCG will now exit.');
		} else {
			console.error('UNCAUGHT EXCEPTION!');
		}

		console.error(err);

		if (global.exitOnUncaught) {
			process.exit(1);
		}
	}
});

process.on('unhandledRejection', err => {
	if (!global.sentryEnabled) {
		console.error('UNHANDLED PROMISE REJECTION!');
		console.error(err);
	}
});

const server = require('./lib/server')
	.on('error', () => process.exit(1))
	.on('stopped', () => process.exit(0));

exitHook(() => {
	server.stop();
});

server.start();
