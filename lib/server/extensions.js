'use strict';

var EventEmitter = require('events').EventEmitter,
    fs = require('fs'),
    path = require('path'),
    bundles = require('../bundles'),
    ExtensionApi = require('../extension_api'),
    log = require('../logger')('nodecg/lib/server/extensions');

var extensions = {};
var expressExtensions = [];

exports = new EventEmitter();

bundles.on('allLoaded', function(allBundles) {
    log.trace('Starting extension mounting');

    var unsatisfiedDeps = [];
    function checkBundles(bundle) {
        bundle.bundleDependencies.forEach(checkBundleDep);
        log.warn('Extension for bundle %s could not be mounted, as it had unsatisfied dependencies:',
            bundle.name, unsatisfiedDeps.join(', '));
        bundles.remove(bundle.name);
    }
    function checkBundleDep(dep) {
        if (extensions.hasOwnProperty(dep)) return;
        unsatisfiedDeps.push(dep);
    }

    while(allBundles.length > 0) {
        var startLen = allBundles.length;
        for (var i = 0; i < startLen; i++) {
            if (!allBundles[i].extension) {
                allBundles.splice(i, 1);
                break;
            }

            if (!allBundles[i].bundleDependencies) {
                log.debug('Bundle %s has extension with no dependencies', allBundles[i].name);
                _loadExtension(allBundles[i]);
                allBundles.splice(i, 1);
                break;
            }

            if (_bundleDepsSatisfied(allBundles[i])) {
                log.debug('Bundle %s has extension with satisfied dependencies', allBundles[i].name);
                _loadExtension(allBundles[i]);
                allBundles.splice(i, 1);
                break;
            }
        }

        var endLen = allBundles.length;
        if (startLen === endLen) {
            allBundles.forEach(checkBundles);
            log.warn('%d bundle(s) could not be loaded, as their dependencies were not satisfied', endLen);
            break;
        }
    }

    exports.emit('extensionsLoaded');
    log.trace('Completed extension mounting');
});

exports.getExtensions = function() {
    // TODO: return copy?
    return extensions;
};

exports.getExpressExtensions = function() {
    return expressExtensions;
};

function _loadExtension(bundle) {
    var extPath = path.join(bundle.dir, bundle.extension.path);
    if (fs.existsSync(extPath)) {
        try {
            var extension = require(extPath)(new ExtensionApi(bundle));
            if (bundle.extension.express) {
                expressExtensions.push([extension, bundle.name]);
                log.info('Mounted %s extension as an express app', bundle.name);
            } else {
                log.info('Mounted %s extension as a generic extension', bundle.name);
            }
            extensions[bundle.name] = extension;
        } catch (err) {
            bundles.remove(bundle.name);
            log.error('Failed to mount %s extension:', bundle.name, err.stack);
        }
    } else {
        log.error('Specified entry point %s for %s does not exist. Skipped.', bundle.extension.path, bundle.name);
    }
}

function _bundleDepsSatisfied(bundle) {
    var deps = bundle.bundleDependencies;

    for (var extName in extensions) {
        if (!extensions.hasOwnProperty(extName)) continue;
        var index = deps.indexOf(extName);
        if (index > -1) {
            deps.splice(index, 1);
        }
    }

    return deps.length === 0;
}

module.exports = exports;
