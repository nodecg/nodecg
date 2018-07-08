'use strict';

// Packages
const test = require('ava');

// Ours
require('./helpers/nodecg-and-webdriver')(test); // Must be first.
const bundleManager = require('../lib/bundle-manager');

test('should load bundles which have satisfied bundle dependencies', t => {
	const allBundles = bundleManager.all();
	const foundBundle = allBundles.find(bundle => bundle.name === 'satisfied-bundle-deps');
	t.truthy(foundBundle);
});

test('should not load bundles which have unsatisfied bundle dependencies', t => {
	const allBundles = bundleManager.all();
	const foundBundle = allBundles.find(bundle => bundle.name === 'unsatisfied-bundle-deps');
	t.is(foundBundle, undefined);
});
