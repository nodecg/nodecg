'use strict';

var chokidar = require('chokidar');
var path = require('path');
var log = require('../logger')('nodecg/lib/bundles/watcher');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var fs = require('fs');

require('string.prototype.endswith');

var backoffTimer = null;
var changes = {};

// Patterns for chokidar to watch or ignore
var watchPatterns = [
    'bundles/**/dashboard/**',    // Watch dashboard folders
    'bundles/**/package.json', // Watch bundle package.json files
    'bundles/**/bower.json',   // Watch bundle package.json files
    '!**/*___jb_*___',         // Ignore temp files created by JetBrains IDEs
    '!**/node_modules/**',     // Ignore node_modules folders
    '!**/bower_components/**'  // Ignore bower_components folders
];

var watcher = chokidar.watch(watchPatterns, {
    ignored: /[\/\\]\./,
    persistent: true,
    ignoreInitial: true,
    usePolling: true // Non-polling is really buggy for us right now.
});

watcher.on('add', function(filepath) {
    handleChange(filepath, 'add');
});
watcher.on('change', function(filepath) {
    handleChange(filepath, 'change');
});
watcher.on('unlink', function(filepath) {
    handleChange(filepath, 'unlink');
});

// TODO: Add specific event for when a bundle is deleted (determined by nodecg.json being deleted)
// On changed/added/deleted
function handleChange(filepath, event) { // jshint ignore: line
    var filename = path.basename(filepath);
    var dirname = path.dirname(filepath);
    var bundleName = '', prevPart = '', bundlePath = '';
    var res = filepath.split(path.sep);

    // Extract the bundle name from the filepath
    // Walk up the path in reverse, once we find "bundles" we know the previous dir was the bundle
    res.reverse().forEach(function(part) {
        if(part === 'bundles') {
            bundleName = prevPart;
            bundlePath = path.resolve(__dirname, '../../bundles', bundleName);
        }
        prevPart = part;
    });

    // If the file resided in the bundle's root, there's only a few things it could be
    // Else, if the file resided in the bundle's dashboard folder, we should reload its panels
    var type = 'unknown';
    if (dirname.endsWith(bundleName)) {
        switch (filename) {
            case 'nodecg.json':
                // If nodecg.json was removed, assume the bundle was deleted
                if (!fs.existsSync(filepath)) {
                    emitter.emit('bundleRemoved', bundleName);
                    return;
                }
                break;
            case 'package.json':
                type = 'npm';
                break;
            case 'bower.json':
                type = 'bower';
                break;
        }
    } else if (dirname.indexOf('dashboard') >= 0) {
        type = 'dashboard';
    }

    // If this bundle's nodecg.json doesn't exist, return
    if (!fs.existsSync(bundlePath + '/nodecg.json')) {
        log.debug('Not acting on change detected in %s, as it lacks a nodecg.json', bundleName);
        return;
    }

    if (backoffTimer) {
        log.debug('Backoff active, delaying event for change detected in', bundleName, ':', filepath);
        if (changes[bundleName] && changes[bundleName].indexOf(type) < 0) {
            changes[bundleName].push(type);
        } else {
            changes[bundleName] = [type];
        }
        resetBackoffTimer();
    } else {
        log.debug('Change detected in', bundleName, ':', filepath);
        resetBackoffTimer();
        emitter.emit('bundleChanged', bundleName, [type]);
    }
}

function resetBackoffTimer() {
    clearTimeout(backoffTimer);
    backoffTimer = setTimeout(function() {
        backoffTimer = null;
        for (var bundleName in changes) {
            if (!changes.hasOwnProperty(bundleName)) continue;
            log.debug('Backoff finished, emitting change event for', bundleName);
            emitter.emit('bundleChanged', bundleName, changes[bundleName]);
        }
        changes = {};
    }, 500);
}

watcher.on('error', function(error) {
    log.error(error.stack);
});

exports = module.exports = emitter;
