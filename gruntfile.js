'use strict';

var istanbul = require('browserify-istanbul');

module.exports = function(grunt) {
    var jshintFiles = ['index.js', 'lib/**/*.js', '!lib/browser/public/*.js'];
    var browserifyFiles = ['lib/api.js'];

    var gruntConfig = {
        less: {
            compile: {
                files: {
                    'lib/dashboard/public/dashboard.css': 'lib/dashboard/src/dashboard.less',
                    'lib/dashboard/public/nodecg-classes.css': 'lib/dashboard/src/nodecg-classes.less'
                }
            }
        },
        jshint: {
            options: {
                jshintrc: true
            },
            all: jshintFiles
        },
        browserify: {
            dist: {
                files: {
                    './lib/browser/public/browserifiedApi.min.js': browserifyFiles
                },
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
                        ['envify', {
                            _: 'purge',
                            browser: true
                        }],
                        'brfs'
                    ],
                    ignore: [
                        './lib/server/index.js',
                        './lib/replicator.js',
                        './lib/util.js'
                    ]
                }
            },
            coverage: {
                files: {
                    './lib/browser/public/browserifiedTestApi.js': browserifyFiles
                },
                options: {
                    browserifyOptions: {
                        debug: true
                    },
                    transform: [
                        ['aliasify', {
                            aliases: {
                                './logger': './lib/browser/logger',
                                './replicant': './lib/browser/replicant'
                            },
                            verbose: false
                        }],
                        ['envify', {
                            _: 'purge',
                            browser: true
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
            }
        },
        watch: {
            stylesheets: {
                files: [
                    'lib/dashboard/src/dashboard.less',
                    'lib/dashboard/src/nodecg-classes.less'
                ],
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
                files: ['lib/api.js', 'lib/browser/*.js'],
                tasks: ['browserify'],
                options: {
                    debounceDelay: 250
                }
            }
        }
    };

    grunt.initConfig(gruntConfig);

    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['less', 'jshint', 'browserify']);
};
