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
import appRootPath from 'app-root-path';
import semver from 'semver';
import exitHook from 'exit-hook';
import fetch from 'make-fetch-happen';

const cwd = process.cwd();
if (cwd !== appRootPath.path) {
	console.warn('[nodecg] process.cwd is %s, expected %s', cwd, appRootPath.path);
	process.chdir(appRootPath.path);
	console.info('[nodecg] Changed process.cwd to %s', appRootPath.path);
}

if (!process.env.NODECG_ROOT) {
	// This must happen before we import any of our other application code.
	process.env.NODECG_ROOT = process.cwd();
}

// Ours
import { pjson } from './util';
import NodeCGServer from './server';

process.title = 'NodeCG';
global.exitOnUncaught = true;

const nodeVersion = process.versions.node;
process.title += ` - ${String(pjson.version)}`;

if (!semver.satisfies(nodeVersion, pjson.engines.node)) {
	console.error(`ERROR: NodeCG requires Node.js ${String(pjson.engines.node)}`);
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

const server = new NodeCGServer();
server.on('error', () => process.exit(1));
server.on('stopped', () => {
	if (!process.exitCode) {
		process.exit(0);
	}
});
server.start().catch(error => {
	console.error(error);
	process.nextTick(() => {
		process.exit(1);
	});
});

exitHook(() => {
	server.stop();
});

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
