'use strict';

const path = require('path');
const semver = require('semver');

module.exports = function (pkg, bundlePath) {
	if (!semver.valid(pkg.version)) {
		throw new Error(`${pkg.name}'s package.json must specify a valid version.`);
	}

	// Check if this manifest has a nodecg property
	if (!{}.hasOwnProperty.call(pkg, 'nodecg')) {
		throw new Error(`${pkg.name}'s package.json lacks a "nodecg" property, and therefore cannot be parsed.`);
	}

	if (!semver.validRange(pkg.nodecg.compatibleRange)) {
		throw new Error(`${pkg.name}'s package.json does not have a valid "nodecg.compatibleRange" property.`);
	}

	const bundleFolderName = path.parse(bundlePath).base;
	if (bundleFolderName !== pkg.name) {
		throw new Error(`${pkg.name}'s folder is named "${bundleFolderName}". ` +
			`Please rename it to "${pkg.name}".`);
	}

	const bundle = pkg.nodecg;

	// Grab the standard properties from the package.json that we care about.
	bundle.name = pkg.name;
	bundle.version = pkg.version;
	bundle.license = pkg.license;
	bundle.description = pkg.description;
	bundle.homepage = pkg.homepage;
	bundle.author = pkg.author;
	bundle.contributors = pkg.contributors;
	bundle.dependencies = pkg.dependencies;
	bundle.enableCustomCues = typeof pkg.nodecg.enableCustomCues === 'undefined' ? false : pkg.nodecg.enableCustomCues;
	bundle.transformBareModuleSpecifiers = Boolean(pkg.nodecg.transformBareModuleSpecifiers);

	return bundle;
};
