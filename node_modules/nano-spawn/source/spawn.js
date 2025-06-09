import {spawn} from 'node:child_process';
import {once} from 'node:events';
import process from 'node:process';
import {applyForceShell} from './windows.js';
import {getResultError} from './result.js';

export const spawnSubprocess = async (file, commandArguments, options, context) => {
	try {
		// When running `node`, keep the current Node version and CLI flags.
		// Not applied with file paths to `.../node` since those indicate a clear intent to use a specific Node version.
		// This also provides a way to opting out, e.g. using `process.execPath` instead of `node` to discard current CLI flags.
		// Does not work with shebangs, but those don't work cross-platform anyway.
		[file, commandArguments] = ['node', 'node.exe'].includes(file.toLowerCase())
			? [process.execPath, [...process.execArgv.filter(flag => !flag.startsWith('--inspect')), ...commandArguments]]
			: [file, commandArguments];

		const instance = spawn(...await applyForceShell(file, commandArguments, options));
		bufferOutput(instance.stdout, context, 'stdout');
		bufferOutput(instance.stderr, context, 'stderr');

		// The `error` event is caught by `once(instance, 'spawn')` and `once(instance, 'close')`.
		// But it creates an uncaught exception if it happens exactly one tick after 'spawn'.
		// This prevents that.
		instance.once('error', () => {});

		await once(instance, 'spawn');
		return instance;
	} catch (error) {
		throw getResultError(error, {}, context);
	}
};

const bufferOutput = (stream, {state}, streamName) => {
	if (stream) {
		stream.setEncoding('utf8');
		if (!state.isIterating) {
			state.isIterating = false;
			stream.on('data', chunk => {
				state[streamName] += chunk;
				state.output += chunk;
			});
		}
	}
};
