'use strict';

// Packages
const test = require('ava');
const axios = require('axios');

// Ours
require('./helpers/nodecg-and-webdriver')(test); // Must be first.
const C = require('./helpers/test-constants');
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

test('should serve bundle-specific bower_components', async t => {
	const response = await axios.get(`${C.BUNDLE_BOWER_COMPONENTS_URL}confirmation.js`);
	t.is(response.status, 200);
	t.is(response.data, 'const confirmed = \'bower_components_confirmed\';\n');
});

test('should serve bundle-specific node_modules', async t => {
	const response = await axios.get(`${C.BUNDLE_NODE_MODULES_URL}confirmation.js`);
	t.is(response.status, 200);
	t.is(response.data, 'const confirmed = \'node_modules_confirmed\';\n');
});

test('should 404 on non-existent bower_component', async t => {
	try {
		await axios.get(`${C.BUNDLE_BOWER_COMPONENTS_URL}confirmation_404.js`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});

test('should 404 on non-existent node_module', async t => {
	try {
		await axios.get(`${C.BUNDLE_NODE_MODULES_URL}confirmation_404.js`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});

test('should 404 on non-existent bundle node_modules/bower_components', async t => {
	try {
		await axios.get(`${C.ROOT_URL}bundles/false-bundle/node_modules/confirmation_404.js`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});
