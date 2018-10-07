'use strict';

// Packages
import test from 'ava';
import * as axios from 'axios';

// Ours
import * as server from './helpers/server';
server.setup();
import * as C from './helpers/test-constants';

test('should redirect /graphics to /graphics/', async t => {
	const response = await axios.get(C.graphicUrl().slice(0, -1));
	t.is(response.status, 200);
	t.is(response.request.res.responseUrl, C.graphicUrl());
});

test('should 404 on non-existent file', async t => {
	try {
		await axios.get(`${C.graphicUrl()}confirmation_404.js`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});

test('should 404 on non-existent bundle', async t => {
	try {
		await axios.get(`${C.rootUrl()}bundles/false-bundle/graphics/confirmation_404.js`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});
