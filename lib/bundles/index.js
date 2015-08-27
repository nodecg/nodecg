'use strict';

var path = require('path');
var events = require('events');
var fs = require('fs');
var Q = require('q');
var semver = require('semver');
var nodecgVersion = require('../../package.json').version;
var watcher = require('./watcher.js');
var parseBundle = require('nodecg-bundle-parser');
var installNpmDeps = require('./dep_installers/npm');
var installBowerDeps = require('./dep_installers/bower');
var log = require('../logger')('nodecg/lib/bundles');

exports = module.exports = new events.EventEmitter();

var _bundles = [];

log.trace('Loading bundles');

// Create the "bundles" dir if it does not exist
if (!fs.existsSync('bundles/')) {
    fs.mkdirSync('bundles');
}

// Do an initial load of each bundle in the "bundles" folder.
// During runtime, any changes to a bundle's "dashboard" folder will trigger a re-load of that bundle.
var depInstallerPromises = [];
fs.readdirSync('bundles/').forEach(function(bundleFolderName) {
    var bundlePath = path.resolve('bundles/' + bundleFolderName);
    if (!fs.lstatSync(bundlePath).isDirectory()) return;

    // Parse each bundle and push the result onto the _bundles array
    var bundle;
    var bundleCfgPath = path.resolve('cfg/', bundleFolderName + '.json');
    if (fs.existsSync(bundleCfgPath)) {
        bundle = parseBundle(bundlePath, bundleCfgPath);
    } else {
        bundle = parseBundle(bundlePath);
    }

    // Check if the bundle is compatible with this version of NodeCG
    if (!semver.satisfies(nodecgVersion, bundle.compatibleRange)) {
        log.error('%s is requires NodeCG version %s, current version is %s',
            bundle.name, bundle.compatibleRange, nodecgVersion);
        return;
    }

    // TODO: make this error better explain why a bundle might be undefined
    if (typeof bundle === 'undefined') {
        log.error('Could not load bundle in directory', bundleFolderName);
        return;
    }

    _bundles.push(bundle);

    // TODO make this all happen in series, fuck `syncNpm`.
    var npmPromise = installNpmDeps(bundle);
    var bowerPromise = installBowerDeps(bundle);
    depInstallerPromises.push(npmPromise, bowerPromise);
});

// Once all the dependency installation have been resolved, start up the bundle watcher and emit "allLoaded"
Q.all(depInstallerPromises)
    .then(function() {

        watcher.on('bundleChanged', function (name, changes) {
            changes.forEach(function (change) {
                var bundle = exports.find(name);
                if (!bundle) return;
                switch (change) {
                    case 'npm':
                        /* Do nothing if package.json changed */
                        break;
                    case 'bower':
                        /* Do nothing if bower.json changed */
                        break;
                    case 'dashboard':
                        var reparsedBundle = parseBundle(bundle.dir);
                        _replaceBundle(name, reparsedBundle);
                        exports.emit('bundleChanged', bundle);
                        break;
                    default:
                        log.error('Unknown change type %s for bundle %s', change, name);
                        break;
                }
            });
        });

        watcher.on('bundleRemoved', function(name) {
            log.info('%s\'s nodecg.json can no longer be found on disk, ' +
                'assuming the bundle has been deleted or moved', name);
            exports.remove(name);
        });

        exports.emit('allLoaded', exports.all());
    })
    .fail(function(err) {
        log.error(err.stack);
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

// Replaces bundle with the specified "name" with "newBundle"
// If no bundle with this name is found, pushes "newBundle" onto the end of the _bundles array.
function _replaceBundle(name, newBundle) {
    var len = _bundles.length;
    var existingIndex;
    for (var i = 0; i < len; i++) {
        if (_bundles[i].name === name) {
            existingIndex = i;
            break;
        }
    }

    if (existingIndex >= 0) {
        _bundles.splice(existingIndex, 1, newBundle);
    } else {
        _bundles.push(newBundle);
    }
}
