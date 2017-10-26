'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Packages
const test = require('ava');
const fetch = require('make-fetch-happen');

// Ours
require('./helpers/nodecg-and-webdriver')(test); // Must be first.
const C = require('./helpers/test-constants');

test('serves files from custom mountpoints', async t => {
	const response = await fetch(`${C.DASHBOARD_URL}/bundles/test-bundle/custom-mount/hello-world.html`);
	const bodyText = await response.text();

	const filePath = path.resolve(
		__dirname,
		'fixtures/nodecg-core/bundles/test-bundle/custom-mount-folder/hello-world.html'
	);
	t.is(bodyText, fs.readFileSync(filePath, 'utf-8'));
});

test('returns a 404 when the file is not found', async t => {
	const response = await fetch(`${C.DASHBOARD_URL}/bundles/test-bundle/custom-mount/not-found.html`);
	t.is(response.status, 404);
});
