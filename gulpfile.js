'use strict';

const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const del = require('del');
const exorcist = require('exorcist');
const gulp = require('gulp');
const gutil = require('gulp-util');
const source = require('vinyl-source-stream');
const transform = require('vinyl-transform');

const buildDirectory = 'build';

/**
 * Waits for the given ReadableStream
 */
function waitFor(stream) {
	return new Promise((resolve, reject) => {
		stream.on('end', resolve);
		stream.on('error', reject);
	});
}

function clean() {
	return del([buildDirectory, '.nyc_output', 'coverage']);
}

function browserApi() {
	return Promise.all([waitFor(buh()), waitFor(buh({ instrument: true }))]);
}

function buh({ instrument } = {}) {
	// Set up the browserify instance on a task basis
	const b = browserify({
		entries: './lib/api.js',
		debug: true,
		// Defining transforms here will avoid crashing your stream
		transform: [
			[
				'babelify',
				{
					global: true,
					presets: ['@babel/preset-env', ['minify', { builtIns: false }]],
					comments: false,
					minified: true,
					sourceMaps: true,
					plugins: instrument ? ['istanbul'] : [],
				},
			],
			[
				'aliasify',
				{
					/**
					 * Aliasify can't process modern ES6 code,
					 * and global transforms run after non-global ones.
					 * Therefore, we have to ensure that aliasify runs _after_ babelify,
					 * which means it too must be global.
					 */
					global: true,
					aliases: {
						'./logger': './lib/browser/logger',
						'./replicant': './lib/browser/replicant',
						'./config': './lib/browser/config',
					},
					verbose: false,
				},
			],
		],
	});

	// Ignore some files that we don't want in the browser bundle.
	['express', './lib/server/index.js', './lib/replicator.js', './lib/util/index.js'].forEach(file => {
		b.ignore(file);
	});

	return b
		.bundle()
		.pipe(source('nodecg-api.min.js'))
		.pipe(buffer())
		.pipe(
			transform(() => {
				return exorcist(
					instrument ? 'build/instrumented/nodecg-api.min.js.map' : 'build/src/nodecg-api.min.js.map',
				);
			}),
		)
		.on('error', gutil.log)
		.pipe(gulp.dest(instrument ? 'build/instrumented' : 'build/src'));
}

exports.clean = clean;
exports['browser-api'] = gulp.series(clean, browserApi);
exports.default = gulp.series(clean, browserApi);

process.on('unhandledRejection', r => {
	console.error('UNHANDLED PROMISE REJECTION:\n', r.stack ? r.stack : r);
});
