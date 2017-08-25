'use strict';

// Const babel = require('gulp-babel');
const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const cleanCSS = require('gulp-clean-css');
const del = require('del');
const exorcist = require('exorcist');
const gulp = require('gulp');
const gulpif = require('gulp-if');
const gutil = require('gulp-util');
const htmlmin = require('gulp-htmlmin');
const imagemin = require('gulp-imagemin');
const mergeStream = require('merge-stream');
const polymerBuild = require('polymer-build');
const source = require('vinyl-source-stream');
// Const sourcemaps = require('gulp-sourcemaps');
const transform = require('vinyl-transform');

const polymerProject = new polymerBuild.PolymerProject(require('./polymer.json'));
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

gulp.task('clean', () => {
	return del([
		buildDirectory,
		'.nyc_output',
		'coverage',
		'instrumented'
	]);
});

gulp.task('browser-api', ['clean'], () => {
	return Promise.all([
		waitFor(buh()),
		waitFor(buh({instrument: true}))
	]);
});

function buh({instrument} = {}) {
	// Set up the browserify instance on a task basis
	const b = browserify({
		entries: './lib/api.js',
		debug: true,
		// Defining transforms here will avoid crashing your stream
		transform: [
			['babelify', {
				global: true,

				// Once MacOS High Sierra and iOS 11 are out, we can remove the `es2015-nostrict` preset.
				// It's needed for now because Safari currently does not properly scope the `let` keyword,
				// meaning that we have to compile our code down to ES5 to work on Safari/iOS.
				// This is fixed in Safari Tech Preview, and should be included in the next release in Fall.
				presets: ['es2015-nostrict', 'minify'],
				comments: false,
				minified: true,
				sourceMaps: true,
				plugins: instrument ? ['istanbul'] : []
			}],
			['aliasify', {
				aliases: {
					'./logger': './lib/browser/logger',
					'./replicant': './lib/browser/replicant',
					'./config': './lib/browser/config'
				},
				verbose: false
			}]
		]
	});

	// Ignore some files that we don't want in the browser bundle.
	[
		'./lib/server/index.js',
		'./lib/replicator.js',
		'./lib/util/index.js'
	].forEach(file => {
		b.ignore(file);
	});

	return b.bundle()
		.pipe(source('nodecg-api.min.js'))
		.pipe(buffer())
		.pipe(transform(() => {
			return exorcist(instrument ? 'instrumented/nodecg-api.min.js.map' : 'build/src/nodecg-api.min.js.map');
		}))
		.on('error', gutil.log)
		.pipe(gulp.dest(instrument ? 'instrumented' : 'build/src'));
}

gulp.task('polymer-build', ['clean'], async () => {
	// Lets create some inline code splitters in case you need them later in your build.
	const buildStreamSplitter = new polymerBuild.HtmlSplitter();

	const sourcesStream = polymerProject.sources()
		.pipe(gulpif(/\.(png|gif|jpg|svg)$/, imagemin()));

	const dependenciesStream = polymerProject.dependencies();

	// Okay, now let's merge your sources & dependencies together into a single build stream.
	const buildStream = mergeStream(sourcesStream, dependenciesStream)
		.once('data', () => {
			console.log('Analyzing build dependencies...');
		})

		.pipe(buildStreamSplitter.split())
		.pipe(gulpif(/\.css$/, cleanCSS()))
		.pipe(gulpif(/\.html$/, htmlmin({
			collapseWhitespace: true,
			removeComments: true,
			minifyCSS: true
		})))

		// Bundling and JS minification and  are disabled until the source map bugs are fixed.
		// .pipe(gulpif(/\.js$/, sourcemaps.init({loadMaps: true})))
		// .pipe(gulpif(/\.js$/, babel({
		// 	presets: ['minify']
		// })))
		// .pipe(gulpif(/\.js$/, sourcemaps.write('src/maps')))
		.pipe(buildStreamSplitter.rejoin())

		// .pipe(polymerProject.bundler({sourcemaps: false, stripComments: true}))
		.pipe(gulp.dest(buildDirectory));

	// WaitFor the buildStream to complete
	await waitFor(buildStream);

	// You did it!
	console.log('Build complete!');
});

process.on('unhandledRejection', r => {
	console.error('UNHANDLED PROMISE REJECTION:\n', r.stack ? r.stack : r);
});

gulp.task('default', ['browser-api', 'polymer-build']);
