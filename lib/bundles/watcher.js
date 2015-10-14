'use strict';

var chokidar = require('chokidar');
var path = require('path');
var log = require('../logger')('nodecg/lib/bundles/watcher');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var fs = require('fs');

require('string.prototype.endswith');

// TODO: Just use the "debounce" lib instead of this handcrafted "backoffTimer" thing
var backoffTimer = null;
var hasChanged = {};

// Patterns for chokidar to watch or ignore
var watchPatterns = [
    'bundles/**/dashboard/**', // Watch dashboard folders
    'bundles/**/package.json', // Watch bundle package.json files
    'bundles/**/bower.json',   // Watch bundle bower.json files
    '!**/*___jb_*___',         // Ignore temp files created by JetBrains IDEs
    '!**/node_modules/**',     // Ignore node_modules folders
    '!**/bower_components/**'  // Ignore bower_components folders
];

var watcher = chokidar.watch(watchPatterns, {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true
});

watcher.on('add', function (filepath) {
    handleChange(filepath, 'add');
});
watcher.on('change', function (filepath) {
    handleChange(filepath, 'change');
});
watcher.on('unlink', function (filepath) {
    handleChange(filepath, 'unlink');
});

// On changed/added/deleted
function handleChange(filepath) {
    var filename = path.basename(filepath);
    var dirname = path.dirname(filepath);
    var bundleName = '', prevPart = '', bundlePath = '';
    var res = filepath.split(path.sep);

    // Extract the bundle name from the filepath
    // Walk up the path in reverse, once we find "bundles" we know the previous dir was the bundle
    res.reverse().forEach(function (part) {
        if (part === 'bundles') {
            bundleName = prevPart;
            bundlePath = path.resolve(__dirname, '../../bundles', bundleName);
        }
        prevPart = part;
    });

    // If the file resided in the bundle's root, there's only a few things it could be
    // Else, if the file resided in the bundle's dashboard folder, we should reload its panels
    if (dirname.endsWith(bundleName)) {
        switch (filename) {
            case 'package.json':
                // If package.json was removed, assume the bundle was deleted
                if (!fs.existsSync(filepath)) {
                    emitter.emit('bundleRemoved', bundleName);
                    return;
                } else {
                    emitChange(bundleName);
                }

                // Else, re-parse the bundle
                emitChange(bundleName);
                break;
        }
    } else if (dirname.indexOf('dashboard') >= 0) {
        emitChange(bundleName);
    }

    // If this bundle's package.json doesn't exist, return
    if (!fs.existsSync(bundlePath + '/package.json')) {
        log.debug('Not acting on change detected in %s, as it lacks a package.json', bundleName);
    }
}

function emitChange(bundleName) {
    if (backoffTimer) {
        log.debug('Backoff active, delaying event for change detected in', bundleName);
        hasChanged[bundleName] = true;
        resetBackoffTimer();
    } else {
        resetBackoffTimer();
        emitter.emit('bundleChanged', bundleName);
    }
}

function resetBackoffTimer() {
    clearTimeout(backoffTimer);
    backoffTimer = setTimeout(function () {
        backoffTimer = null;
        for (var bundleName in hasChanged) {
            if (!hasChanged.hasOwnProperty(bundleName)) continue;
            log.debug('Backoff finished, emitting change event for', bundleName);
            emitter.emit('bundleChanged', bundleName);
        }
        hasChanged = {};
    }, 500);
}

watcher.on('error', function (error) {
    log.error(error.stack);
});

module.exports = emitter;
