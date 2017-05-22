'use strict';

const babel = require('gulp-babel');
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
	return del([buildDirectory]);
});

gulp.task('browser-api', ['clean'], () => {
	// Set up the browserify instance on a task basis
	const b = browserify({
		entries: './lib/api.js',
		debug: true,
		// Defining transforms here will avoid crashing your stream
		transform: [
			['babelify', {
				global: true,
				presets: ['babili'],
				comments: false,
				minified: true,
				sourceMaps: true
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
			return exorcist('build/src/nodecg-api.min.js.map');
		}))
		.on('error', gutil.log)
		.pipe(gulp.dest('build/src'));
});

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
		// .pipe(gulpif(/\.js$/, sourcemaps.init({loadMaps: true})))
		.pipe(gulpif(/\.js$/, babel({
			presets: ['babili']
		})))
		// .pipe(gulpif(/\.js$/, sourcemaps.write('src/maps')))
		.pipe(buildStreamSplitter.rejoin())

		// Can't enable sourcemaps until this issue is resolved:
		// https://github.com/Polymer/polymer-bundler/issues/516
		// The core problem here seems to be bugs in the source-map lib.
		// This lib hasn't had a new release in over a year and does not seem to be maintained.
		// There are several critical issues and mergable pull requests with no replies on them.
		.pipe(polymerProject.bundler({sourcemaps: false, stripComments: true}))
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
