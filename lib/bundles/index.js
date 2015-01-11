'use strict';

var parse = require('./parser.js'),
    events = require('events'),
    watcher = require('./watcher.js'),
    fs = require('fs'),
    Q = require('q'),
    util = require('util'),
    log = require('../logger')('nodecg/lib/bundles');

exports = module.exports = new events.EventEmitter();

var _bundles = [];

log.trace("Loading bundles");

// Do an initial scan of the bundles dir
if (!fs.existsSync('bundles/')) {
    fs.mkdirSync('bundles');
}

var _bundlesDir = fs.readdirSync('bundles/');
var promises = [];
_bundlesDir.forEach(function(bundleFolderName) {
    if (!fs.lstatSync('bundles/' + bundleFolderName).isDirectory()) return;
    var parsePromise = parse(bundleFolderName);

    // If key files are missing/incompatible, parsePromise is null, not a promise
    // This might be a dumb antipattern, or it might be a genius optimization
    // Could really go either way with me
    // UPDATE: Jan 10, 2015: Yeah this is definitely a dumb antipattern.
    // TODO: Make this not a dumb antipattern. Function "parse" should ALWAYS return a promise.
    if (parsePromise) {
        var postParsePromise = parsePromise.then(function(bundle) {
            if (!bundle) return;
            log.trace("Parsed bundle %s", bundle.name);
            _bundles.push(bundle);
        });
        promises.push(postParsePromise);
    }
});

Q.all(promises)
    .then(function() {
        watcher.on('bundleChanged', function (name) {
            var parsePromise = parse(name);

            if (parsePromise) {
                parsePromise.then(function(bundle) {
                    log.info("%s was changed, and has been reloaded from disk", name);
                    exports.add(bundle);
                });
            } else {
                log.info("%s's nodecg.json can no longer be found on disk, assuming the bundle has been deleted or moved", name);
                exports.remove(name);
            }
        });

        exports.emit('allLoaded', exports.all());
    })
    .fail(function(er) {
        log.error('', er.stack);
    });

exports.all = function() {
    // return a clone of the array, not a reference to it
    return _bundles.slice(0);
};

exports.find = function(name) {
    var len = _bundles.length;
    for (var i = 0; i < len; i++) {
        if (_bundles[i].name === name) return _bundles[i];
    }
    return null;
};

exports.add = function(bundle) {
    // If the parser rejects a bundle for some reason (such as a NodeCG version mismatch), it will be null
    if(!bundle) return;
    _bundles.push(bundle);
};

exports.remove = function(bundleName) {
    var len = _bundles.length;
    for (var i = 0; i < len; i++) {
        if (!_bundles[i]) continue; // TODO: this check shouldn't have to happen, idk why things in this array can sometimes be undefined
        if (_bundles[i].name === bundleName) _bundles.splice(i, 1);
    }
};
