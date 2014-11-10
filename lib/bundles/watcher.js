'use strict';

var gaze = require('gaze'),
    path = require('path'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;

require('string.prototype.endswith');

function Watcher() {
    EventEmitter.call(this);
    var self = this;

    // Patterns for gaze to watch or ignore
    var watchPatterns = [
        'bundles/**',     // Watch bundles folder
        '!**/*___jb_*___' // Ignore temp files created by JetBrains IDEs
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

            console.log("[lib/bundle/watcher.js] Change detected in " + bundleName + ": " + filepath + " " + event);
            self.changeDetected(bundleName);
        });
    });
}

util.inherits(Watcher, EventEmitter);

Watcher.prototype.changeDetected = function(name) {
    this.emit("bundleChanged", name);
};

module.exports = new Watcher();
