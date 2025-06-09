import path from 'node:path';
import {constants as fsConstants} from 'node:fs';
import {pEvent} from 'p-event';
import CopyFileError from './copy-file-error.js';
import * as fs from './fs.js';

const copyFileAsync = async (source, destination, options) => {
	let readError;
	const {size} = await fs.stat(source);

	const readStream = await fs.createReadStream(source);
	await fs.makeDirectory(path.dirname(destination), {mode: options.directoryMode});
	const writeStream = fs.createWriteStream(destination, {flags: options.overwrite ? 'w' : 'wx'});

	const emitProgress = writtenBytes => {
		if (typeof options.onProgress !== 'function') {
			return;
		}

		options.onProgress({
			sourcePath: path.resolve(source),
			destinationPath: path.resolve(destination),
			size,
			writtenBytes,
			percent: writtenBytes === size ? 1 : writtenBytes / size,
		});
	};

	readStream.on('data', () => {
		emitProgress(writeStream.bytesWritten);
	});

	readStream.once('error', error => {
		readError = new CopyFileError(`Cannot read from \`${source}\`: ${error.message}`, error);
	});

	let shouldUpdateStats = false;
	try {
		const writePromise = pEvent(writeStream, 'close');
		readStream.pipe(writeStream);
		await writePromise;
		emitProgress(size);
		shouldUpdateStats = true;
	} catch (error) {
		throw new CopyFileError(`Cannot write to \`${destination}\`: ${error.message}`, error);
	}

	if (readError) {
		throw readError;
	}

	if (shouldUpdateStats) {
		const stats = await fs.lstat(source);

		return Promise.all([
			fs.utimes(destination, stats.atime, stats.mtime),
			fs.chmod(destination, stats.mode),
		]);
	}
};

const resolvePath = (cwd, sourcePath, destinationPath) => {
	sourcePath = path.resolve(cwd, sourcePath);
	destinationPath = path.resolve(cwd, destinationPath);

	return {
		sourcePath,
		destinationPath,
	};
};

export async function copyFile(sourcePath, destinationPath, options = {}) {
	if (!sourcePath || !destinationPath) {
		throw new CopyFileError('`source` and `destination` required');
	}

	if (options.cwd) {
		({sourcePath, destinationPath} = resolvePath(options.cwd, sourcePath, destinationPath));
	}

	options = {
		overwrite: true,
		...options,
	};

	return copyFileAsync(sourcePath, destinationPath, options);
}

const checkSourceIsFile = (stat, source) => {
	if (stat.isDirectory()) {
		throw Object.assign(new CopyFileError(`EISDIR: illegal operation on a directory '${source}'`), {
			errno: -21,
			code: 'EISDIR',
			source,
		});
	}
};

export function copyFileSync(sourcePath, destinationPath, options = {}) {
	if (!sourcePath || !destinationPath) {
		throw new CopyFileError('`source` and `destination` required');
	}

	if (options.cwd) {
		({sourcePath, destinationPath} = resolvePath(options.cwd, sourcePath, destinationPath));
	}

	options = {
		overwrite: true,
		...options,
	};

	const stat = fs.statSync(sourcePath);
	checkSourceIsFile(stat, sourcePath);
	fs.makeDirectorySync(path.dirname(destinationPath), {mode: options.directoryMode});

	const flags = options.overwrite ? null : fsConstants.COPYFILE_EXCL;
	try {
		fs.copyFileSync(sourcePath, destinationPath, flags);
	} catch (error) {
		if (!options.overwrite && error.code === 'EEXIST') {
			return;
		}

		throw error;
	}

	fs.utimesSync(destinationPath, stat.atime, stat.mtime);
}
