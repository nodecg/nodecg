'use strict';

const browserify = require('browserify');
const buffer = require('vinyl-buffer');
const exorcist = require('exorcist');
const gulp = require('gulp');
const gutil = require('gulp-util');
const mergeStream = require('merge-stream');
const PolymerProject = require('polymer-build').PolymerProject;
const source = require('vinyl-source-stream');
const transform = require('vinyl-transform');
const project = new PolymerProject(require('./polymer.json'));

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

gulp.task('polymer-build', ['browser-api'], () => {
	mergeStream(project.sources(), project.dependencies())
		.pipe(project.bundler())
		.pipe(gulp.dest('build/'));
});

gulp.task('default', ['browser-api', 'polymer-build']);
