'use strict';

process.title = 'NodeCG';
global.exitOnUncaught = true;

const cwd = process.cwd();
const runningInZeitPkg = __dirname.startsWith('/snapshot/') || __dirname.startsWith('C:\\snapshot\\');
if (!runningInZeitPkg && cwd !== __dirname) {
	console.warn('[nodecg] process.cwd is %s, expected %s', cwd, __dirname);
	process.chdir(__dirname);
	console.info('[nodecg] Changed process.cwd to %s', __dirname);
}

if (!process.env.NODECG_ROOT) {
	process.env.NODECG_ROOT = process.cwd();
}

const semver = require('semver');
const nodeVersion = process.versions.node;
if (!semver.satisfies(nodeVersion, '>=6')) {
	console.error('ERROR: NodeCG requires Node.js >=6 and npm >=2');
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

server.start();
