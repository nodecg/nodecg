'use strict';

module.exports = function (grunt) {
	require('load-grunt-tasks')(grunt);

	grunt.initConfig({
		browserify: {
			dist: {
				files: {
					'./src/nodecg-api.min.js': 'lib/api.js'
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
					'./src/nodecg-api.min.js.map': ['./src/nodecg-api.min.js']
				}
			}
		}
	});

	grunt.registerTask('default', ['browserify:dist', 'exorcise']);
};
