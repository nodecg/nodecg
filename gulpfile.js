'use strict';

const babel = require('gulp-babel');
const babiliPreset = require('babel-preset-babili');
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

gulp.task('browser-api', () => {
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
			return exorcist('src/nodecg-api.min.js.map');
		}))
		.on('error', gutil.log)
		.pipe(gulp.dest('./src/'));
});

// Adapted from polymer-cli
gulp.task('polymer-build', ['browser-api'], async () => {
	// Lets create some inline code splitters in case you need them later in your build.
	const buildStreamSplitter = new polymerBuild.HtmlSplitter();

	// Okay, so first thing we do is clear the build directory
	console.log(`Deleting ${buildDirectory} directory...`);
	await del([buildDirectory]);

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
			minifyCSS: true,
			uglifyJS: true
		})))
		.pipe(gulpif(/\.js$/, babel({
			presets: [
				babiliPreset(null, {
					unsafe: {simplifyComparisons: false}
				})
			],

			// This one file has an enormous regex in it that makes babili explode.
			// This will probably be fixed eventually? When it is, we can remove this ignore line.
			ignore: ['**/property-effects.html_script_0.js']
		})))
		.pipe(buildStreamSplitter.rejoin())

		.pipe(polymerProject.bundler())
		.pipe(gulp.dest(buildDirectory));

	// WaitFor the buildStream to complete
	await waitFor(buildStream);

	// You did it!
	console.log('Build complete!');
});

gulp.task('default', ['browser-api', 'polymer-build']);
