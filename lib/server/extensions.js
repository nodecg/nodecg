'use strict';

var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var path = require('path');
var bundles = require('../bundles');
var ExtensionApi = require('../api');
var log = require('../logger')('nodecg/lib/server/extensions');

var extensions = {};

exports = new EventEmitter();

bundles.on('allLoaded', function(allBundles) {
    log.trace('Starting extension mounting');

    while(allBundles.length > 0) {
        var startLen = allBundles.length;
        for (var i = 0; i < startLen; i++) {
            // If this bundle does not have an extension, remove it from the list
            if (!allBundles[i].extension) {
                allBundles.splice(i, 1);
                break;
            }

            // If this bundle has no dependencies, load it and remove it from the list
            if (!allBundles[i].bundleDependencies) {
                log.debug('Bundle %s has extension with no dependencies', allBundles[i].name);
                _loadExtension(allBundles[i]);
                allBundles.splice(i, 1);
                break;
            }

            // If this bundle has dependencies, and all of them are satisfied, load it and remove it from the list
            if (_bundleDepsSatisfied(allBundles[i])) {
                log.debug('Bundle %s has extension with satisfied dependencies', allBundles[i].name);
                _loadExtension(allBundles[i]);
                allBundles.splice(i, 1);
                break;
            }
        }

        var endLen = allBundles.length;
        if (startLen === endLen) {
            // This block can only ever be entered once, so its safe to define a function here
            // even though we're inside of a `while` loop.
            /* jshint -W083 */

            // Any bundles left over must have had unsatisfied dependencies.
            // Print a warning about each bundle, and what its unsatisfied deps were.
            // Then, unload the bundle.
            allBundles.forEach(function (bundle) {
                var unsatisfiedDeps = [];
                bundle.bundleDependencies.forEach(function (dep) {
                    if (extensions.hasOwnProperty(dep)) return;
                    unsatisfiedDeps.push(dep);
                });
                log.warn('Extension for bundle %s could not be mounted, as it had unsatisfied dependencies:',
                    bundle.name, unsatisfiedDeps.join(', '));
                bundles.remove(bundle.name);
            });
            /*jshint +W083 */
            log.warn('%d bundle(s) could not be loaded, as their dependencies were not satisfied', endLen);
            break;
        }
    }

    exports.allLoaded = true;
    exports.emit('extensionsLoaded');
    log.trace('Completed extension mounting');
});

exports.getExtensions = function() {
    // TODO: return copy?
    return extensions;
};

function _loadExtension(bundle) {
    var extPath = path.join(bundle.dir, bundle.extension.path);
    if (fs.existsSync(extPath)) {
        try {
            var extension = require(extPath)(new ExtensionApi(bundle));
            log.info('Mounted %s extension', bundle.name);
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
