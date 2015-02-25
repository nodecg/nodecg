'use strict';

var chokidar = require('chokidar');
var path = require('path');
var log = require('../logger')('nodecg/lib/bundles/watcher');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();

require('string.prototype.endswith');

var backoffTimer = null;
var changedBundles = [];

// Patterns for chokidar to watch or ignore
var watchPatterns = [
    'bundles/**',             // Watch bundles folder
    '!**/*___jb_*___',        // Ignore temp files created by JetBrains IDEs
    '!bundles/*/view/**',     // Ignore view folders. Might watch them in a later NodeCG version, but not now.
    '!**/node_modules/**',    // Ignore node_modules folders
    '!**/bower_components/**' // Ignore bower_components folders
];

var watcher = chokidar.watch(watchPatterns, {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true
});

watcher.on('add', handleChange);
watcher.on('change', handleChange);
watcher.on('unlink', handleChange);

// On changed/added/deleted
function handleChange(filepath) {
    // Extract the bundle name from the filepath
    var bundleName = '';
    var res = filepath.split(path.sep);
    var prevPart = '';

    // Walk up the path in reverse, once we find "bundles" we know the previous dir was the bundle
    res.reverse().forEach(function(part) {
        if(part === 'bundles') {
            bundleName = prevPart;
        }
        prevPart = part;
    });

    if (backoffTimer) {
        log.debug('Backoff active, delaying event for change detected in', bundleName, ': ', filepath);
        if (changedBundles.indexOf(bundleName) < 0) {
            changedBundles.push(bundleName);
        }
        resetBackoffTimer();
    } else {
        log.debug('Change detected in', bundleName, ': ', filepath);
        resetBackoffTimer();
        emitter.emit('bundleChanged', bundleName);
    }
}

function resetBackoffTimer() {
    clearTimeout(backoffTimer);
    backoffTimer = setTimeout(function() {
        backoffTimer = null;
        changedBundles.forEach(function(bundleName) {
            log.debug('Backoff finished, emitting change event for', bundleName);
            emitter.emit('bundleChanged', bundleName);
        });
        changedBundles = [];
    }, 500);
}

watcher.on('error', function(error) {
    log.error(error.stack);
});

exports = module.exports = emitter;
