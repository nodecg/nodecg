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

// Packages
import semver from 'semver';
import fetch from 'node-fetch-commonjs';

// Ours
import rootPath from '../shared/utils/rootPath';

const cwd = process.cwd();
if (cwd !== rootPath.path) {
	console.warn('[nodecg] process.cwd is %s, expected %s', cwd, rootPath.path);
	process.chdir(rootPath.path);
	console.info('[nodecg] Changed process.cwd to %s', rootPath.path);
}

if (!process.env.NODECG_ROOT) {
	// This must happen before we import any of our other application code.
	process.env.NODECG_ROOT = process.cwd();
}

// Ours
import { pjson, asyncExitHook } from './util';
import NodeCGServer from './server';
import { gracefulExit } from './util/exit-hook';

process.title = 'NodeCG';
global.exitOnUncaught = true;

process.title += ` - ${String(pjson.version)}`;

process.on('uncaughtException', (err) => {
	if (!global.sentryEnabled) {
		if (global.exitOnUncaught) {
			console.error('UNCAUGHT EXCEPTION! NodeCG will now exit.');
		} else {
			console.error('UNCAUGHT EXCEPTION!');
		}

		console.error(err);
		if (global.exitOnUncaught) {
			gracefulExit(1);
		}
	}
});

process.on('unhandledRejection', (err) => {
	if (!global.sentryEnabled) {
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
			console.warn(
				'An update is available for NodeCG: %s (current: %s)',
				JSON.parse(body).version,
				pjson.version,
			);
		}
	})
	.catch(
		/* istanbul ignore next */ () => {
			// Discard errors.
		},
	);
