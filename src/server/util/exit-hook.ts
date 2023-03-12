// Adapted from https://github.com/sindresorhus/exit-hook/blob/9fdc03b855f12f79a0d13246c38ca9b2114c8d2e/index.js
import process from 'node:process';

type syncExitFn = (signal: number) => void;
type asyncExitFn = (signal: number) => void | Promise<void>;
type anyExitFn = syncExitFn | asyncExitFn;

const asyncCallbacks = new Set<[asyncExitFn, number | undefined]>();
const callbacks = new Set<syncExitFn>();

let isCalled = false;
let isRegistered = false;

async function exit(shouldManuallyExit: boolean, isSynchronous: boolean, signal: number) {
	if (isCalled) {
		return;
	}

	isCalled = true;

	if (asyncCallbacks.size > 0 && isSynchronous) {
		console.error(
			[
				'SYNCHRONOUS TERMINATION NOTICE:',
				'When explicitly exiting the process via process.exit or via a parent process,',
				'asynchronous tasks in your exitHooks will not run. Either remove these tasks,',
				'use gracefulExit() instead of process.exit(), or ensure your parent process',
				'sends a SIGINT to the process running this code.',
			].join(' '),
		);
	}

	const exitCode = 128 + signal;

	const done = (force = false) => {
		if (force || shouldManuallyExit) {
			process.exit(exitCode);
		}
	};

	for (const callback of callbacks) {
		callback(exitCode);
	}

	if (isSynchronous) {
		done();
		return;
	}

	const promises = [];
	let forceAfter = 0;
	for (const [callback, wait] of asyncCallbacks) {
		forceAfter = Math.max(forceAfter, wait ?? 0);
		promises.push(Promise.resolve(callback(exitCode)));
	}

	// Force exit if we exceeded our wait value
	const asyncTimer = setTimeout(() => {
		done(true);
	}, forceAfter);

	await Promise.all(promises);
	clearTimeout(asyncTimer);
	done();
}

function addHook(options: { onExit: anyExitFn; minimumWait?: number; isSynchronous: boolean }) {
	const { onExit, minimumWait, isSynchronous } = options;
	const asyncCallbackConfig: [asyncExitFn, number | undefined] = [onExit, minimumWait];

	if (isSynchronous) {
		callbacks.add(onExit);
	} else {
		asyncCallbacks.add(asyncCallbackConfig);
	}

	if (!isRegistered) {
		isRegistered = true;

		// Exit cases that support asynchronous handling
		process.once('beforeExit', exit.bind(undefined, true, false, -128));
		process.once('SIGHUP', exit.bind(undefined, true, false, 1));
		process.once('SIGINT', exit.bind(undefined, true, false, 2));
		process.once('SIGTERM', exit.bind(undefined, true, false, 15));

		// Explicit exit events. Calling will force an immediate exit and run all
		// synchronous hooks. Explicit exits must not extend the node process
		// artificially. Will log errors if asynchronous calls exist.
		process.once('exit', exit.bind(undefined, false, true, 0));

		// PM2 Cluster shutdown message. Caught to support async handlers with pm2,
		// needed because explicitly calling process.exit() doesn't trigger the
		// beforeExit event, and the exit event cannot support async handlers,
		// since the event loop is never called after it.
		process.on('message', (message) => {
			if (message === 'shutdown') {
				void exit(true, true, -128);
			}
		});
	}

	return () => {
		if (isSynchronous) {
			callbacks.delete(onExit);
		} else {
			asyncCallbacks.delete(asyncCallbackConfig);
		}
	};
}

export default function exitHook(onExit: syncExitFn) {
	if (typeof onExit !== 'function') {
		throw new TypeError('onExit must be a function');
	}

	return addHook({
		onExit,
		isSynchronous: true,
	});
}

export function asyncExitHook(onExit: asyncExitFn, options: { minimumWait?: number } = {}) {
	if (typeof onExit !== 'function') {
		throw new TypeError('onExit must be a function');
	}

	if (!(typeof options.minimumWait === 'number' && options.minimumWait > 0)) {
		throw new TypeError('minimumWait must be set to a positive numeric value');
	}

	return addHook({
		onExit,
		minimumWait: options.minimumWait,
		isSynchronous: false,
	});
}

export function gracefulExit(signal = 0) {
	void exit(true, false, -128 + signal);
}
