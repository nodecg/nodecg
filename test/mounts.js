'use strict';

// Native
import * as fs from 'fs';
import * as path from 'path';

// Packages
import test from 'ava';
const fetch = require('make-fetch-happen')

// Ours
import * as server from './helpers/server'
server.setup()
import * as C from './helpers/test-constants';

test('serves files from custom mountpoints', async t => {
	const response = await fetch(`${C.rootUrl()}bundles/test-bundle/custom-mount/hello-world.html`);
	const bodyText = await response.text();

	const filePath = path.resolve(
		__dirname,
		'fixtures/nodecg-core/bundles/test-bundle/custom-mount-folder/hello-world.html'
	);
	t.is(bodyText, fs.readFileSync(filePath, 'utf-8'));
});

test('returns a 404 when the file is not found', async t => {
	const response = await fetch(`${C.rootUrl()}bundles/test-bundle/custom-mount/not-found.html`);
	t.is(response.status, 404);
});
