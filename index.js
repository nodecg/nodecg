'use strict';

if (process.cwd() !== __dirname) {
	console.warn('[nodecg] process.cwd is %s, expected %s', process.cwd(), __dirname);
	process.chdir(__dirname);
	console.info('[nodecg] Changed process.cwd to %s', __dirname);
}

const semver = require('semver');
const nodeVersion = process.versions.node;
if (!semver.satisfies(nodeVersion, '>=6')) {
	console.error('ERROR: NodeCG requires Node.js >=6 and npm >=2');
	console.error(`       Your Node.js version: v${nodeVersion}`);
	return;
}

process.on('uncaughtException', err => {
	if (!global.rollbarEnabled) {
		console.error('UNCAUGHT EXCEPTION! NodeCG will now exit.');
		console.error(err.stack);
		process.exit(1);
	}
});

const server = require('./lib/server')
	.on('error', () => process.exit(1))
	.on('stopped', () => process.exit(0));

server.start();
