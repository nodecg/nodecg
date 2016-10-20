'use strict';

const EventEmitter = require('events').EventEmitter;
const path = require('path');
const semver = require('semver');
const bundles = require('../bundles');
const ExtensionApi = require('../api');
const log = require('../logger')('nodecg/lib/server/extensions');
const extensions = {};

exports = new EventEmitter();

// TODO: Some of what's happening in here has nothing to do with extensions
log.trace('Starting extension mounting');

// Prevent us from messing with other listeners of this event
const allBundles = bundles.all();

// Track which bundleManager we know are fully loaded (extension and all)
const fullyLoaded = [];

while (allBundles.length > 0) {
	const startLen = allBundles.length;
	for (let i = 0; i < startLen; i++) {
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

	const endLen = allBundles.length;
	if (startLen === endLen) {
		// This block can only ever be entered once, so its safe to define a function here
		// even though we're inside of a `while` loop.
		/* eslint-disable no-loop-func */

		// Any bundleManager left over must have had unsatisfied dependencies.
		// Print a warning about each bundle, and what its unsatisfied deps were.
		// Then, unload the bundle.
		allBundles.forEach(bundle => {
			const unsatisfiedDeps = [];

			for (const dep in bundle.bundleDependencies) {
				if (!{}.hasOwnProperty.call(bundle.bundleDependencies, dep)) {
					continue;
				}

				if (bundle._satisfiedDepNames.indexOf(dep) > -1) {
					continue;
				}

				unsatisfiedDeps.push(`${dep}@${bundle.bundleDependencies[dep]}`);
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

log.trace('Completed extension mounting');

exports.getExtensions = function () {
	return extensions;
};

function _loadExtension(bundle) {
	const extPath = path.join(bundle.dir, 'extension');
	try {
		const extension = require(extPath)(new ExtensionApi(bundle));
		log.info('Mounted %s extension', bundle.name);
		extensions[bundle.name] = extension;
	} catch (err) {
		bundles.remove(bundle.name);
		log.error('Failed to mount %s extension:', bundle.name, err.stack);
	}
}

function _bundleDepsSatisfied(bundle, loadedBundles) {
	const deps = bundle.bundleDependencies;
	const unsatisfiedDepNames = Object.keys(deps);
	bundle._satisfiedDepNames = bundle._satisfiedDepNames || [];

	loadedBundles.forEach(loadedBundle => {
		// Find out if this loaded bundle is one of the dependencies of the bundle in question.
		// If so, check if the version loaded satisfies the dependency.
		const index = unsatisfiedDepNames.indexOf(loadedBundle.name);
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
