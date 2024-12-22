// Packages
import test from 'ava';

// Ours
import * as server from './helpers/server';
server.setup();
import * as C from './helpers/test-constants';

test('should redirect /graphics to /graphics/', async (t) => {
	const response = await fetch(C.graphicUrl().slice(0, -1));
	t.is(response.status, 200);
	t.is(response.redirected, true);
	t.is(response.url, C.graphicUrl());
});

test('should 404 on non-existent file', async (t) => {
	const response = await fetch(`${C.graphicUrl()}confirmation_404.js`);
	t.is(response.status, 404);
});

test('should 404 on non-existent bundle', async (t) => {
	const response = await fetch(`${C.rootUrl()}bundles/false-bundle/graphics/confirmation_404.js`);
	t.is(response.status, 404);
});
