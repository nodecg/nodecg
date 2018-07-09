'use strict';

// Packages
const test = require('ava');
const axios = require('axios');

// Ours
require('./helpers/nodecg-and-webdriver')(test); // Must be first.
const C = require('./helpers/test-constants');

test('should redirect /graphics to /graphics/', async t => {
	const response = await axios.get(C.GRAPHIC_URL.slice(0, -1));
	t.is(response.status, 200);
	t.is(response.request.res.responseUrl, C.GRAPHIC_URL);
});

test('should 404 on non-existent file', async t => {
	try {
		await axios.get(`${C.GRAPHIC_URL}confirmation_404.js`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});

test('should 404 on non-existent bundle', async t => {
	try {
		await axios.get(`${C.ROOT_URL}bundles/false-bundle/graphics/confirmation_404.js`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});
