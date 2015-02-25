'use strict';

var chokidar = require('chokidar');
var path = require('path');
var log = require('../logger')('nodecg/lib/bundles/watcher');
var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();

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
    ignoreInitial: true
});

watcher.on('add', handleChange);
watcher.on('change', handleChange);
watcher.on('unlink', handleChange);

// TODO: Add specific event for when a bundle is deleted (determined by nodecg.json being deleted)
// On changed/added/deleted
function handleChange(filepath) {
    var filename = path.basename(filepath);
    var dirname = path.dirname(filepath);

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

    var type = 'unknown';
    if (filename === 'package.json' && dirname.endsWith(bundleName)) {
        type = 'npm';
    } else if (filename === 'bower.json' && dirname.endsWith(bundleName)) {
        type = 'bower';
    } else if (dirname.indexOf('dashboard') >= 0) {
        type = 'dashboard';
    }

    if (backoffTimer) {
        log.debug('Backoff active, delaying event for change detected in', bundleName, ':', filepath);
        if (changes[bundleName]) {
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
