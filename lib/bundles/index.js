'use strict';

var parse = require('./parser.js');
var events = require('events');
var watcher = require('./watcher.js');
var fs = require('fs');
var Q = require('q');
var log = require('../logger')('nodecg/lib/bundles');

exports = module.exports = new events.EventEmitter();

var _bundles = [];

log.trace('Loading bundles');

// Do an initial scan of the bundles dir
if (!fs.existsSync('bundles/')) {
    fs.mkdirSync('bundles');
}

var _bundlesDir = fs.readdirSync('bundles/');
var promises = [];
_bundlesDir.forEach(function(bundleFolderName) {
    if (!fs.lstatSync('bundles/' + bundleFolderName).isDirectory()) return;

    // Begin parsing each folder. Push each parse promise onto an array.
    promises.push(
        parse(bundleFolderName)
            .then(function(bundle) {
                if (!bundle) return;
                log.trace('Parsed bundle %s', bundle.name);
                _bundles.push(bundle);
            })
    );
});

// Once all the initial parse promises have been resolved, start up the bundle watcher
Q.all(promises)
    .then(function() {
        watcher.on('bundleChanged', function (name) {
            parse(name)
                .then(function(bundle) {
                    if (bundle) {
                        log.info('%s was changed, and has been reloaded from disk', name);
                        exports.add(bundle);
                    } else {
                        log.info('%s\'s nodecg.json can no longer be found on disk, ' +
                        'assuming the bundle has been deleted or moved', name);
                        exports.remove(name);
                    }
                });
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
    if (this.find(bundle.name)) this.remove(bundle.name); // remove any existing bundles with this name
    _bundles.push(bundle);
};

exports.remove = function(bundleName) {
    var len = _bundles.length;
    for (var i = 0; i < len; i++) {
        // TODO: this check shouldn't have to happen, idk why things in this array can sometimes be undefined
        if (!_bundles[i]) continue;
        if (_bundles[i].name === bundleName) _bundles.splice(i, 1);
    }
};
