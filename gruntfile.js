'use strict';

module.exports = function(grunt) {
    var lessFiles = {
        'lib/dashboard/src/dashboard.less': 'lib/dashboard/public/dashboard.css'
    };

    var jshintFiles = ['index.js', 'lib/**/*.js', '!lib/browser/public/*.js'];
    var browserifyFiles = ['lib/api.js'];

    grunt.initConfig({
        less: {
            compile: {
                files: lessFiles
            }
        },
        jshint: {
            options: {
                jshintrc: true
            },
            all: jshintFiles
        },
        browserify: {
            options: {
                browserifyOptions: {
                    debug: true
                },
                plugin: [
                    ['minifyify', {
                        map: '/nodecg-api.map.json',
                        output: 'lib/browser/public/browserifiedApi.map.json'
                    }]
                ],
                transform: [
                    ['aliasify', {
                        aliases: {
                            './logger': './lib/browser/logger',
                            './replicant': './lib/browser/replicant'
                        },
                        verbose: false
                    }],
                    'brfs'
                ],
                ignore: [
                    './lib/server/index.js',
                    './lib/replicator.js',
                    './lib/util.js'
                ]
            },
            './lib/browser/public/browserifiedApi.min.js': browserifyFiles
        },
        watch: {
            stylesheets: {
                files: lessFiles,
                tasks: ['less'],
                options: {
                    debounceDelay: 250
                }
            },
            scripts: {
                files: jshintFiles,
                tasks: ['jshint'],
                options: {
                    debounceDelay: 250
                }
            },
            clientScripts: {
                files: browserifyFiles,
                tasks: ['browserify'],
                options: {
                    debounceDelay: 250
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['less', 'jshint', 'browserify']);
};
