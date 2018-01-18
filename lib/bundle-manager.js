'use strict';

// Native
const EventEmitter = require('events').EventEmitter;
const fs = require('fs.extra');
const path = require('path');

// Packages
const chokidar = require('chokidar');
const debounce = require('lodash.debounce');
const semver = require('semver');

// Ours
const parseBundle = require('./bundle-parser');
const parseBundleGit = require('./bundle-parser/git');

// Start up the watcher, but don't watch any files yet.
// We'll add the files we want to watch later, in the init() method.
const watcher = chokidar.watch([
	'!**/*___jb_*___', // Ignore temp files created by JetBrains IDEs
	'!**/node_modules/**', // Ignore node_modules folders
	'!**/bower_components/**', // Ignore bower_components folders
	'!**/*.lock' // Ignore lockfiles
], {
	persistent: true,
	ignoreInitial: true,
	followSymlinks: true
});

const emitter = new EventEmitter();
const bundles = [];
let log;
let _cfgPath;
let _bundlesPath;
let backoffTimer = null;
let hasChanged = {};
let initialized = false;

// This is on a debouncer to avoid false-positives that can happen when editing a manifest.
const debouncedManifestDeletionCheck = debounce((bundleName, manifestPath) => {
	if (fs.existsSync(manifestPath)) {
		handleChange(bundleName);
	} else {
		log.debug('Processing removed event for', bundleName);
		log.info('%s\'s package.json can no longer be found on disk, ' +
			'assuming the bundle has been deleted or moved', bundleName);
		module.exports.remove(bundleName);
		emitter.emit('bundleRemoved', bundleName);
	}
}, 100);

const debouncedGitChangeHandler = debounce(bundleName => {
	const bundle = module.exports.find(bundleName);
	if (!bundle) {
		return;
	}

	bundle.git = parseBundleGit(bundle);
	emitter.emit('gitChanged', bundle);
}, 250);

module.exports = emitter;

/**
 * Constructs a bundle-manager.
 * @param bundlesPath {String} - The path to NodeCG's "bundles" folder
 * @param cfgPath {String} - The path to NodeCG's "cfg" folder.
 * @param nodecgVersion {String} - The value of "version" in NodeCG's package.json.
 * @param nodecgConfig {Object} - The global NodeCG config.
 * @param Logger {Function} - A preconfigured @nodecg/logger constructor.
 * @return {Object} - A bundle-manager instance.
 */
module.exports.init = function (bundlesPath, cfgPath, nodecgVersion, nodecgConfig, Logger) {
	if (initialized) {
		throw new Error('Cannot initialize when already initialized');
	}

	initialized = true;
	_bundlesPath = bundlesPath;
	_cfgPath = cfgPath;
	log = new Logger('nodecg/lib/bundles');
	log.trace('Loading bundles');

	// Create the "bundles" dir if it does not exist.
	/* istanbul ignore if: We know this code works and testing it is tedious, so we don't bother to test it. */
	if (!fs.existsSync(bundlesPath)) {
		fs.mkdirpSync(bundlesPath);
	}

	/* istanbul ignore next */
	watcher.on('add', filePath => {
		const bundleName = extractBundleName(filePath);

		// In theory, the bundle parser would have thrown an error long before this block would execute,
		// because in order for us to be adding a panel HTML file, that means that the file would have been missing,
		// which the parser does not allow and would throw an error for.
		// Just in case though, its here.
		if (isPanelHTMLFile(bundleName, filePath)) {
			handleChange(bundleName);
		} else if (isGitData(bundleName, filePath)) {
			debouncedGitChangeHandler(bundleName);
		}
	});

	watcher.on('change', filePath => {
		const bundleName = extractBundleName(filePath);

		if (isManifest(bundleName, filePath) || isPanelHTMLFile(bundleName, filePath)) {
			handleChange(bundleName);
		} else if (isGitData(bundleName, filePath)) {
			debouncedGitChangeHandler(bundleName);
		}
	});

	watcher.on('unlink', filePath => {
		const bundleName = extractBundleName(filePath);

		if (isPanelHTMLFile(bundleName, filePath)) {
			// This will cause NodeCG to crash, because the parser will throw an error due to
			// a panel's HTML file no longer being present.
			handleChange(bundleName);
		} else if (isManifest(bundleName, filePath)) {
			debouncedManifestDeletionCheck(bundleName, filePath);
		} else if (isGitData(bundleName, filePath)) {
			debouncedGitChangeHandler(bundleName);
		}
	});

	/* istanbul ignore next */
	watcher.on('error', error => {
		log.error(error.stack);
	});

	// Do an initial load of each bundle in the "bundles" folder.
	// During runtime, any changes to a bundle's "dashboard" folder will trigger a re-load of that bundle,
	// as will changes to its `package.json`.
	fs.readdirSync(bundlesPath).forEach(bundleFolderName => {
		const bundlePath = path.join(bundlesPath, bundleFolderName);
		if (!fs.statSync(bundlePath).isDirectory()) {
			return;
		}

		if (nodecgConfig && nodecgConfig.bundles && nodecgConfig.bundles.disabled &&
			nodecgConfig.bundles.disabled.indexOf(bundleFolderName) > -1) {
			log.debug('Not loading bundle ' + bundleFolderName + ' as it is disabled in config');
			return;
		}

		if (nodecgConfig && nodecgConfig.bundles && nodecgConfig.bundles.enabled &&
			nodecgConfig.bundles.enabled.indexOf(bundleFolderName) < 0) {
			log.debug('Not loading bundle ' + bundleFolderName + ' as it is not enabled in config');
			return;
		}

		// Parse each bundle and push the result onto the bundles array
		let bundle;
		const bundleCfgPath = path.join(cfgPath, `${bundleFolderName}.json`);
		if (fs.existsSync(bundleCfgPath)) {
			bundle = parseBundle(bundlePath, bundleCfgPath);
		} else {
			bundle = parseBundle(bundlePath);
		}

		// Check if the bundle is compatible with this version of NodeCG
		if (!semver.satisfies(nodecgVersion, bundle.compatibleRange)) {
			log.error(
				'%s requires NodeCG version %s, current version is %s',
				bundle.name, bundle.compatibleRange, nodecgVersion
			);
			return;
		}

		// This block can probably be removed in 0.8, but let's leave it for 0.7 just in case.
		/* istanbul ignore next: Given how strict nodecg-bundle-parser is,
		 it should not be possible for "bundle" to be undefined. */
		if (typeof bundle === 'undefined') {
			log.error('Could not load bundle in directory', bundleFolderName);
			return;
		}

		bundles.push(bundle);
	});

	// Workaround for https://github.com/paulmillr/chokidar/issues/419
	// This workaround is necessary to fully support symlinks.
	fs.readdirSync(bundlesPath)
		.map(name => path.join(bundlesPath, name))
		.filter(source => fs.statSync(source).isDirectory())
		.forEach(bundlePath => {
			watcher.add([
				path.join(bundlePath, '.git'), // Watch .git folders
				path.join(bundlePath, 'dashboard'), // Watch dashboard folders
				path.join(bundlePath, 'package.json') // Watch bundle package.json files
			]);
		});

	emitter.emit('init', bundles);
};

/**
 * Returns a shallow-cloned array of all currently active bundles.
 * @returns {Array.<Object>}
 */
module.exports.all = function () {
	return bundles.slice(0);
};

/**
 * Returns the bundle with the given name. undefined if not found.
 * @param name {String} - The name of the bundle to find.
 * @returns {Object|undefined}
 */
module.exports.find = function (name) {
	const len = bundles.length;
	for (let i = 0; i < len; i++) {
		if (bundles[i].name === name) {
			return bundles[i];
		}
	}
};

/**
 * Adds a bundle to the internal list, replacing any existing bundle with the same name.
 * @param bundle {Object}
 */
module.exports.add = function (bundle) {
	/* istanbul ignore if: Again, it shouldn't be possible for "bundle" to be undefined, but just in case... */
	if (!bundle) {
		return;
	}

	// Remove any existing bundles with this name
	if (module.exports.find(bundle.name)) {
		module.exports.remove(bundle.name);
	}

	bundles.push(bundle);
};

/**
 * Removes a bundle with the given name from the internal list. Does nothing if no match found.
 * @param bundleName {String}
 */
module.exports.remove = function (bundleName) {
	const len = bundles.length;
	for (let i = 0; i < len; i++) {
		// TODO: this check shouldn't have to happen, idk why things in this array can sometimes be undefined
		if (!bundles[i]) {
			continue;
		}

		if (bundles[i].name === bundleName) {
			bundles.splice(i, 1);
		}
	}
};

/**
 * Only used by tests.
 */
module.exports._stopWatching = function () {
	watcher.close();
};

function handleChange(bundleName) {
	setTimeout(() => {
		_handleChange(bundleName);
	}, 100);
}

function _handleChange(bundleName) {
	const bundle = module.exports.find(bundleName);

	/* istanbul ignore if: It's rare for `bundle` to be undefined here, but it can happen when using black/whitelisting. */
	if (!bundle) {
		return;
	}

	if (backoffTimer) {
		log.debug('Backoff active, delaying processing of change detected in', bundleName);
		hasChanged[bundleName] = true;
		resetBackoffTimer();
	} else {
		log.debug('Processing change event for', bundleName);
		resetBackoffTimer();

		let reparsedBundle;
		const bundleCfgPath = path.join(_cfgPath, `${bundleName}.json`);
		if (fs.existsSync(bundleCfgPath)) {
			reparsedBundle = parseBundle(bundle.dir, bundleCfgPath);
		} else {
			reparsedBundle = parseBundle(bundle.dir);
		}

		module.exports.add(reparsedBundle);
		emitter.emit('bundleChanged', reparsedBundle);
	}
}

/**
 * Resets the backoff timer used to avoid event thrashing when many files change rapidly.
 */
function resetBackoffTimer() {
	clearTimeout(backoffTimer);
	backoffTimer = setTimeout(() => {
		backoffTimer = null;
		for (const bundleName in hasChanged) {
			/* istanbul ignore if: Standard hasOwnProperty check, doesn't need to be tested */
			if (!{}.hasOwnProperty.call(hasChanged, bundleName)) {
				continue;
			}

			log.debug('Backoff finished, emitting change event for', bundleName);
			handleChange(bundleName);
		}
		hasChanged = {};
	}, 500);
}

/**
 * Returns the name of a bundle that owns a given path.
 * @param filePath {String} - The path of the file to extract a bundle name from.
 * @returns {String} - The name of the bundle that owns this path.
 * @private
 */
function extractBundleName(filePath) {
	const parts = filePath.replace(_bundlesPath, '').split(path.sep);
	return parts[1];
}

/**
 * Checks if a given path is a panel HTML file of a given bundle.
 * @param bundleName {String}
 * @param filePath {String}
 * @returns {Boolean}
 * @private
 */
function isPanelHTMLFile(bundleName, filePath) {
	const bundle = module.exports.find(bundleName);
	if (bundle) {
		return bundle.dashboard.panels.some(panel => {
			return panel.path.endsWith(filePath);
		});
	}

	return false;
}

/**
 * Checks if a given path is the manifest file for a given bundle.
 * @param bundleName {String}
 * @param filePath {String}
 * @returns {Boolean}
 * @private
 */
function isManifest(bundleName, filePath) {
	return path.dirname(filePath).endsWith(bundleName) && path.basename(filePath) === 'package.json';
}

/**
 * Checks if a given path is in the .git dir of a bundle.
 * @param bundleName {String}
 * @param filePath {String}
 * @returns {Boolean}
 * @private
 */
function isGitData(bundleName, filePath) {
	const regex = new RegExp(`${bundleName}${'\\'}${path.sep}${'\\'}.git`);
	return regex.test(filePath);
}
