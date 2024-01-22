/**
 * This file is used to automatically bootstrap a NodeCG Server instance.
 * It exports nothing and offers no controls.
 *
 * At this time, other means of starting NodeCG are not officially supported,
 * but they are used internally by our tests.
 *
 * Tests directly instantiate the NodeCGServer class, so that they may have full control
 * over its lifecycle and when the process exits.
 */

import semver from 'semver';
import fetch from 'node-fetch-commonjs';
import { nodecgRootPath } from '../shared/utils/rootPath';
import { RUN_MODE } from './nodecg-root';

const cwd = process.cwd();

if (RUN_MODE === 'module') {
	console.info('[nodecg] Running as a dependency');
} else if (cwd !== nodecgRootPath) {
	console.warn('[nodecg] process.cwd is %s, expected %s', cwd, nodecgRootPath);
	process.chdir(nodecgRootPath);
	console.info('[nodecg] Changed process.cwd to %s', nodecgRootPath);
}

import { pjson, asyncExitHook } from './util';
import { NodeCGServer } from './server';
import { gracefulExit } from './util/exit-hook';
import { exitOnUncaught, sentryEnabled } from './config';

process.title = `NodeCG - ${pjson.version}`;

process.on('uncaughtException', (err) => {
	if (!sentryEnabled) {
		if (exitOnUncaught) {
			console.error('UNCAUGHT EXCEPTION! NodeCG will now exit.');
		} else {
			console.error('UNCAUGHT EXCEPTION!');
		}

		console.error(err);
		if (exitOnUncaught) {
			gracefulExit(1);
		}
	}
});

process.on('unhandledRejection', (err) => {
	if (!sentryEnabled) {
		console.error('UNHANDLED PROMISE REJECTION!');
		console.error(err);
	}
});

const server = new NodeCGServer();
server.on('error', () => {
	gracefulExit(1);
});
server.on('stopped', () => {
	if (!process.exitCode) {
		gracefulExit(0);
	}
});
server.start().catch((error) => {
	console.error(error);
	process.nextTick(() => {
		gracefulExit(1);
	});
});

asyncExitHook(
	async () => {
		await server.stop();
	},
	{
		minimumWait: 100,
	},
);

// Check for updates
fetch('https://registry.npmjs.org/nodecg/latest')
	.then((res: any) => res.json())
	.then((body: any) => {
		if (semver.gt(body.version, pjson.version)) {
			console.warn('An update is available for NodeCG: %s (current: %s)', JSON.parse(body).version, pjson.version);
		}
	})
	.catch(
		/* istanbul ignore next */ () => {
			// Discard errors.
		},
	);
