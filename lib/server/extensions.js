'use strict';

var EventEmitter = require('events').EventEmitter;
var path = require('path');
var semver = require('semver');
var bundles = require('../bundles');
var ExtensionApi = require('../api');
var log = require('../logger')('nodecg/lib/server/extensions');

var extensions = {};

exports = new EventEmitter();

// TODO: Some of what's happening in here has nothing to do with extensions
bundles.on('allLoaded', function (b) {
	log.trace('Starting extension mounting');

	// Hack to restore the process title after npm has forcibly changed it
	process.title = 'NodeCG';

	// Prevent us from messing with other listeners of this event
	var allBundles = b.slice(0);

	// Track which bundles we know are fully loaded (extension and all)
	var fullyLoaded = [];

	while (allBundles.length > 0) {
		var startLen = allBundles.length;
		for (var i = 0; i < startLen; i++) {
			// If this bundle has no dependencies, load it and remove it from the list
			if (!allBundles[i].bundleDependencies) {
				log.debug('Bundle %s has no dependencies', allBundles[i].name);

				if (allBundles[i].hasExtension) {
					_loadExtension(allBundles[i]);
				}

				fullyLoaded.push(allBundles[i]);
				allBundles.splice(i, 1);
				break;
			}

			// If this bundle has dependencies, and all of them are satisfied, load it and remove it from the list
			if (_bundleDepsSatisfied(allBundles[i], fullyLoaded)) {
				log.debug('Bundle %s has extension with satisfied dependencies', allBundles[i].name);

				if (allBundles[i].hasExtension) {
					_loadExtension(allBundles[i]);
				}

				fullyLoaded.push(allBundles[i]);
				allBundles.splice(i, 1);
				break;
			}
		}

		var endLen = allBundles.length;
		if (startLen === endLen) {
			// This block can only ever be entered once, so its safe to define a function here
			// even though we're inside of a `while` loop.
			/* eslint-disable no-loop-func */

			// Any bundles left over must have had unsatisfied dependencies.
			// Print a warning about each bundle, and what its unsatisfied deps were.
			// Then, unload the bundle.
			allBundles.forEach(function (bundle) {
				var unsatisfiedDeps = [];

				for (var dep in bundle.bundleDependencies) {
					if (!bundle.bundleDependencies.hasOwnProperty(dep)) {
						continue;
					}

					if (bundle._satisfiedDepNames.indexOf(dep) > -1) {
						continue;
					}

					unsatisfiedDeps.push(dep + '@' + bundle.bundleDependencies[dep]);
				}

				log.error('Bundle "%s" can not be loaded, as it has unsatisfied dependencies:\n',
					bundle.name, unsatisfiedDeps.join(', '));
				bundles.remove(bundle.name);
			});
			/* eslint-enable no-loop-func */

			log.error('%d bundle(s) can not be loaded because they have unsatisfied dependencies', endLen);
			break;
		}
	}

	exports.allLoaded = true;
	exports.emit('extensionsLoaded');
	log.trace('Completed extension mounting');
});

exports.getExtensions = function () {
	// TODO: return copy?
	return extensions;
};

function _loadExtension(bundle) {
	var extPath = path.join(bundle.dir, 'extension');
	try {
		var extension = require(extPath)(new ExtensionApi(bundle));
		log.info('Mounted %s extension', bundle.name);
		extensions[bundle.name] = extension;
	} catch (err) {
		bundles.remove(bundle.name);
		log.error('Failed to mount %s extension:', bundle.name, err.stack);
	}
}

function _bundleDepsSatisfied(bundle, loadedBundles) {
	var deps = bundle.bundleDependencies;
	var unsatisfiedDepNames = Object.keys(deps);
	bundle._satisfiedDepNames = bundle._satisfiedDepNames || [];

	loadedBundles.forEach(function (loadedBundle) {
		// Find out if this loaded bundle is one of the dependencies of the bundle in question.
		// If so, check if the version loaded satisfies the dependency.
		var index = unsatisfiedDepNames.indexOf(loadedBundle.name);
		if (index > -1) {
			if (semver.satisfies(loadedBundle.version, deps[loadedBundle.name])) {
				bundle._satisfiedDepNames.push(loadedBundle.name);
				unsatisfiedDepNames.splice(index, 1);
			}
		}
	});

	return unsatisfiedDepNames.length === 0;
}

module.exports = exports;
