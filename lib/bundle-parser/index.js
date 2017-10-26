'use strict';

const fs = require('fs');
const path = require('path');
const parsePanels = require('./panels');
const parseMounts = require('./mounts');
const parseGraphics = require('./graphics');
const parseManifest = require('./manifest');
const parseAssets = require('./assets');
const parseSounds = require('./sounds');
const config = require('./config');
const parseExtension = require('./extension');
const parseGit = require('./git');

module.exports = function (bundlePath, bundleCfgPath) {
	// Resolve the path to the bundle and its package.json
	const pkgPath = path.join(bundlePath, 'package.json');

	if (!fs.existsSync(pkgPath)) {
		throw new Error(`Bundle at path ${bundlePath} does not contain a package.json!`);
	}

	// Read metadata from the package.json
	let pkg;
	try {
		pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
	} catch (e) {
		throw new Error(`${pkgPath} is not valid JSON, ` +
			'please check it against a validator such as jsonlint.com');
	}

	const bundle = parseManifest(pkg, bundlePath);
	bundle.rawManifest = JSON.stringify(bundle);
	bundle.dir = bundlePath;

	// If there is a config file for this bundle, parse it.
	// Else if there is only a configschema for this bundle, parse that and apply any defaults.
	if (bundleCfgPath) {
		bundle.config = config.parse(bundle, bundleCfgPath);
	} else {
		bundle.config = config.parseDefaults(bundle);
	}

	// Parse the dashboard panels
	const dashboardDir = path.resolve(bundle.dir, 'dashboard');
	bundle.dashboard = {
		dir: dashboardDir,
		panels: parsePanels(dashboardDir, bundle)
	};

	// Parse mountpoints
	bundle.mount = parseMounts(bundle);

	// Parse the graphics
	const graphicsDir = path.resolve(bundle.dir, 'graphics');
	bundle.graphics = parseGraphics(graphicsDir, bundle);

	// Parse asset categories
	bundle.assetCategories = parseAssets(pkg);

	// Parse sound cues
	parseSounds(bundle, pkg);

	// Determine if this bundle has an extension that should be loaded by NodeCG
	bundle.hasExtension = parseExtension(bundle.dir, bundle);

	// Parse and store git info, if the bundle is a git repo
	bundle.git = parseGit(bundle);

	return bundle;
};
