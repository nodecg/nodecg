'use strict';

var gaze = require('gaze'),
    path = require('path'),
    util = require('util'),
    log = require('../logger')('nodecg/lib/bundles/watcher'),
    EventEmitter = require('events').EventEmitter,
    emitter = new EventEmitter();

require('string.prototype.endswith');

function Watcher() {
    EventEmitter.call(this);
    var self = this;

    // Patterns for gaze to watch or ignore
    var watchPatterns = [
        'bundles/**',         // Watch bundles folder
        '!**/*___jb_*___',    // Ignore temp files created by JetBrains IDEs
        '!bundles/*/view/**', // Ignore view folders. Might watch them in a later NodeCG version, but not now.
        '!node_modules'       // Ignore node_modules folders
    ];

    gaze(watchPatterns, function(err, watcher) {
        // On changed/added/deleted
        this.on('all', function(event, filepath) {
            // TODO: Check if index.js was changed, and prompt to restart NodeCG. index.js can't be hot-reloaded

            //extract the bundle name from the filepath
            var bundleName = '';
            var res = filepath.split(path.sep);
            var prevPart = '';

            //walk up the path in reverse, once we find "bundles" we know the previous dir was the bundle
            res.reverse().forEach(function(part) {
                if(part === 'bundles') {
                    bundleName = prevPart;
                }
                prevPart = part;
            });

            log.debug("Change detected in " + bundleName + ": " + filepath + " " + event);
            emitter.emit("bundleChanged", bundleName);
        });

        this.on('error', function(error) {
            log.error('Gaze error:', error.stack);
        });
    });
}

module.exports = emitter;
