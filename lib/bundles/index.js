'use strict';

var parse = require('./parser.js'),
    events = require('events'),
    watcher = require('./watcher.js'),
    fs = require('fs'),
    Q = require('q'),
    util = require('util'),
    log = require('../logger');

var _bundles = [];

function Bundles() {
    log.trace("[lib/bundles/index.js] Loading bundles");
    events.EventEmitter.call(this);
    var self = this;

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
        if (parsePromise) {
            var postParsePromise = parsePromise.then(function(bundle) {
                if (!bundle) return;
                log.trace("[lib/bundles/index.js] Parsed bundle %s", bundle.name);
                _bundles.push(bundle);
            });
            promises.push(postParsePromise);
        }
    });

    Q.all(promises)
        .then(function() {
            watcher.on('bundleChanged', function (name) {
                parse(name)
                    .then(function(bundle) {
                        // If nodecg.json is missing from the bundle dir, bundle will equal false
                        if (bundle) {
                            log.info("[lib/bundles/index.js] %s was changed, and has been reloaded from disk", name);
                            self.add(bundle);
                        } else {
                            log.info("[lib/bundles/index.js] %s's nodecg.json can no longer be found on disk, assuming the bundle has been deleted or moved", name);
                            self.remove(name);
                        }
                    });
            });

            self.emit('allLoaded', self.all());
        });
}

util.inherits(Bundles, events.EventEmitter);

Bundles.prototype.all = function() {
    return _bundles;
};

Bundles.prototype.find = function(name) {
    var len = _bundles.length;
    for (var i = 0; i < len; i ++) {
        if (_bundles[i].name === name) return _bundles[i];
    }
    return null;
};

Bundles.prototype.add = function(bundle) {
    // If the parser rejects a bundle for some reason (such as a NodeCG version mismatch), it will be null
    if(!bundle) return;
    _bundles.push(bundle);
};

Bundles.prototype.remove = function(bundleName) {
    var len = _bundles.length;
    for (var i = 0; i < len; i ++) {
        if (_bundles[i].name === bundleName) _bundles.splice(i, 1);
    }
};

module.exports = new Bundles();
