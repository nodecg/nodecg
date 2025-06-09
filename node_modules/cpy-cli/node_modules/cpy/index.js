import process from 'node:process';
import EventEmitter from 'node:events';
import path from 'node:path';
import os from 'node:os';
import pMap from 'p-map';
import arrify from 'arrify';
import {copyFile} from 'cp-file';
import pFilter from 'p-filter';
import {isDynamicPattern} from 'globby';
import micromatch from 'micromatch';
import CpyError from './cpy-error.js';
import GlobPattern from './glob-pattern.js';

const defaultConcurrency = (os.cpus().length || 1) * 2; // eslint-disable-line unicorn/explicit-length-check

/**
@type {import('./index').Options}
*/
const defaultOptions = {
	ignoreJunk: true,
	flat: false,
	cwd: process.cwd(),
};

class Entry {
	/**
	@param {string} source
	@param {string} relativePath
	@param {GlobPattern} pattern
	*/
	constructor(source, relativePath, pattern) {
		/**
		@type {string}
		*/
		this.path = source.split('/').join(path.sep);

		/**
		@type {string}
		*/
		this.relativePath = relativePath.split('/').join(path.sep);

		this.pattern = pattern;

		Object.freeze(this);
	}

	get name() {
		return path.basename(this.path);
	}

	get nameWithoutExtension() {
		return path.basename(this.path, path.extname(this.path));
	}

	get extension() {
		return path.extname(this.path).slice(1);
	}
}

/**
Expand patterns like `'node_modules/{globby,micromatch}'` into `['node_modules/globby', 'node_modules/micromatch']`.

@param {string[]} patterns
@returns {string[]}
*/
const expandPatternsWithBraceExpansion = patterns => patterns.flatMap(pattern => (
	micromatch.braces(pattern, {
		expand: true,
		nodupes: true,
	})
));

/**
@param {object} props
@param {Entry} props.entry
@param {import('./index').Options}
@param {string} props.destination
@returns {string}
*/
const preprocessDestinationPath = ({entry, destination, options}) => {
	if (entry.pattern.hasMagic()) {
		if (options.flat) {
			if (path.isAbsolute(destination)) {
				return path.join(destination, entry.name);
			}

			return path.join(options.cwd, destination, entry.name);
		}

		return path.join(
			destination,
			path.relative(entry.pattern.normalizedPath, entry.path),
		);
	}

	if (path.isAbsolute(destination)) {
		return path.join(destination, entry.name);
	}

	// TODO: This check will not work correctly if `options.cwd` and `entry.path` are on different partitions on Windows, see: https://github.com/sindresorhus/import-local/pull/12
	if (entry.pattern.isDirectory && path.relative(options.cwd, entry.path).startsWith('..')) {
		return path.join(options.cwd, destination, path.basename(entry.pattern.originalPath), path.relative(entry.pattern.originalPath, entry.path));
	}

	if (!entry.pattern.isDirectory && entry.path === entry.relativePath) {
		return path.join(options.cwd, destination, path.basename(entry.pattern.originalPath), path.relative(entry.pattern.originalPath, entry.path));
	}

	if (!entry.pattern.isDirectory && options.flat) {
		return path.join(options.cwd, destination, path.basename(entry.pattern.originalPath));
	}

	return path.join(options.cwd, destination, path.relative(options.cwd, entry.path));
};

/**
@param {string} source
@param {string|Function} rename
*/
const renameFile = (source, rename) => {
	const directory = path.dirname(source);
	if (typeof rename === 'string') {
		return path.join(directory, rename);
	}

	if (typeof rename === 'function') {
		const filename = path.basename(source);
		return path.join(directory, rename(filename));
	}

	return source;
};

/**
@param {string|string[]} source
@param {string} destination
@param {import('./index').Options} options
*/
export default function cpy(
	source,
	destination,
	{concurrency = defaultConcurrency, ...options} = {},
) {
	/**
	@type {Map<string, import('./index').CopyStatus>}
	*/
	const copyStatus = new Map();

	/**
	@type {import('events').EventEmitter}
	*/
	const progressEmitter = new EventEmitter();

	options = {
		...defaultOptions,
		...options,
	};

	const promise = (async () => {
		/**
		@type {Entry[]}
		*/
		let entries = [];
		let completedFiles = 0;
		let completedSize = 0;

		/**
		@type {GlobPattern[]}
		*/
		let patterns = expandPatternsWithBraceExpansion(arrify(source))
			.map(string => string.replace(/\\/g, '/'));
		const sources = patterns.filter(item => !item.startsWith('!'));
		const ignore = patterns.filter(item => item.startsWith('!'));

		if (sources.length === 0 || !destination) {
			throw new CpyError('`source` and `destination` required');
		}

		patterns = patterns.map(pattern => new GlobPattern(pattern, destination, {...options, ignore}));

		for (const pattern of patterns) {
			/**
			@type {string[]}
			*/
			let matches = [];

			try {
				matches = pattern.getMatches();
			} catch (error) {
				throw new CpyError(
					`Cannot glob \`${pattern.originalPath}\`: ${error.message}`,
					error,
				);
			}

			if (matches.length === 0 && !isDynamicPattern(pattern.originalPath) && !isDynamicPattern(ignore)) {
				throw new CpyError(
					`Cannot copy \`${pattern.originalPath}\`: the file doesn't exist`,
				);
			}

			entries = [
				...entries,
				...matches.map(sourcePath => new Entry(sourcePath, path.relative(options.cwd, sourcePath), pattern)),
			];
		}

		if (options.filter !== undefined) {
			entries = await pFilter(entries, options.filter, {concurrency: 1024});
		}

		if (entries.length === 0) {
			progressEmitter.emit('progress', {
				totalFiles: 0,
				percent: 1,
				completedFiles: 0,
				completedSize: 0,
			});
		}

		/**
		@param {import('cp-file').ProgressData} event
		*/
		const fileProgressHandler = event => {
			const fileStatus = copyStatus.get(event.sourcePath) || {
				writtenBytes: 0,
				percent: 0,
			};

			if (
				fileStatus.writtenBytes !== event.writtenBytes
				|| fileStatus.percent !== event.percent
			) {
				completedSize -= fileStatus.writtenBytes;
				completedSize += event.writtenBytes;

				if (event.percent === 1 && fileStatus.percent !== 1) {
					completedFiles++;
				}

				copyStatus.set(event.sourcePath, {
					writtenBytes: event.writtenBytes,
					percent: event.percent,
				});

				progressEmitter.emit('progress', {
					totalFiles: entries.length,
					percent: completedFiles / entries.length,
					completedFiles,
					completedSize,
					sourcePath: event.sourcePath,
					destinationPath: event.destinationPath,
				});
			}
		};

		return pMap(
			entries,
			async entry => {
				const to = renameFile(
					preprocessDestinationPath({
						entry,
						destination,
						options,
					}),
					options.rename,
				);

				try {
					await copyFile(entry.path, to, {...options, onProgress: fileProgressHandler});
				} catch (error) {
					throw new CpyError(
						`Cannot copy from \`${entry.relativePath}\` to \`${to}\`: ${error.message}`,
						error,
					);
				}

				return to;
			},
			{concurrency},
		);
	})();

	promise.on = (...arguments_) => {
		progressEmitter.on(...arguments_);
		return promise;
	};

	return promise;
}
