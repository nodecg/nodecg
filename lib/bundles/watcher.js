// Exports a Watcher singleton

var gaze = require('gaze'),
    path = require('path'),
    util = require("util"),
    EventEmitter = require("events").EventEmitter;

function Watcher() {
    EventEmitter.call(this);
    var self = this;

    //watch the "bundles" folder for changes
    gaze('bundles/**', function(err, watcher) {
        // On changed/added/deleted
        this.on('all', function(event, filepath) {
            //extract the bundle name from the filepath
            var bundlename = '';
            var res = filepath.split(path.sep);
            var prevpart = '';

            //walk up the path in reverse, once we find "bundles" we know the previous dir was the bundle
            res.reverse().forEach(function(part) {
                if(part === 'bundles') {
                    bundlename = prevpart;
                }
                prevpart = part;
            });

            console.log("[lib/bundle/watcher.js] Change detected in " + bundlename + ": " + filepath + " " + event);
            self.changeDetected(bundlename);
        });
    });
};

util.inherits(Watcher, EventEmitter);

Watcher.prototype.changeDetected = function(name) {
    this.emit("bundleChanged", name);
};

module.exports = exports = new Watcher();
