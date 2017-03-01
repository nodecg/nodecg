'use strict';

module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		browserify: {
			dist: {
				files: {
					'./lib/browser/dist/browserifiedApi.min.js': 'lib/api.js'
				},
				options: {
					browserifyOptions: {
						debug: true
					},
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
					],
					ignore: [
						'./lib/server/index.js',
						'./lib/replicator.js',
						'./lib/util/index.js'
					]
				}
			}/* ,
			coverage: {
				files: {
					'./lib/browser/dist/browserifiedTestApi.js': 'lib/api.js'
				},
				options: {
					browserifyOptions: {
						debug: true
					},
					transform: [
						['aliasify', {
							aliases: {
								'./logger': './lib/browser/logger',
								'./replicant': './lib/browser/replicant',
								'./config': './lib/browser/config'
							},
							verbose: false
						}],
						'brfs',
						istanbul
					],
					ignore: [
						'./lib/server/index.js',
						'./lib/replicator.js',
						'./lib/util.js'
					]
				}
			} */
		},
		exorcise: {
			app: {
				options: {},
				files: {
					'./lib/browser/dist/browserifiedApi.min.js.map': ['./lib/browser/dist/browserifiedApi.min.js']
				}
			}
		}
	});

	grunt.registerTask('default', ['browserify:dist', 'exorcise']);
};
