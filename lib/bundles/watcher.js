'use strict';

var chokidar = require('chokidar');
var path = require('path');
var log = require('../logger')('nodecg/lib/bundles/watcher');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();

require('string.prototype.endswith');

// Patterns for gaze to watch or ignore
var watchPatterns = [
    'bundles/**',         // Watch bundles folder
    '!**/*___jb_*___',    // Ignore temp files created by JetBrains IDEs
    '!bundles/*/view/**', // Ignore view folders. Might watch them in a later NodeCG version, but not now.
    '!**/node_modules/**' // Ignore node_modules folders
];

var watcher = chokidar.watch(watchPatterns, {
    ignored: /[\/\\]\./, persistent: true
});

watcher.on('add', handleChange);
watcher.on('change', handleChange);
watcher.on('unlink', handleChange);

// On changed/added/deleted
function handleChange(filepath) {
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

    log.debug('Change detected in', bundleName, ': ', filepath);
    emitter.emit('bundleChanged', bundleName);
}

watcher.on('error', function(error) {
    log.error(error.stack);
});

exports = module.exports = emitter;
