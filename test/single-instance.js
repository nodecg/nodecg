'use strict';

// Packages
const test = require('ava');
const axios = require('axios');

// Ours
require('./helpers/nodecg-and-webdriver')(test, {tabs: ['single-instance']}); // Must be first.
const C = require('./helpers/test-constants');
const e = require('./helpers/test-environment');

test.beforeEach(async () => {
	await e.browser.client.switchTab(e.browser.tabs.singleInstance);
});

test.cb('single-instance graphics shouldn\'t enter an infinite redirect loop when including a polymer element that loads an external stylesheet', t => {
	const singleInstance = require('../lib/graphics/single_instance');

	function cb(url) {
		if (url === '/bundles/test-bundle/graphics/single_instance.html') {
			throw new Error('The graphic must have gotten redirected.');
		}
	}

	process.nextTick(() => {
		singleInstance.once('graphicAvailable', cb);
	});

	setTimeout(() => {
		singleInstance.removeListener('graphicAvailable', cb);
		t.end();
	}, 5000);
});

test('scripts get injected into /instance/*.html routes', async t => {
	const response = await axios.get(`${C.ROOT_URL}instance/killed.html`);
	t.is(response.status, 200);
	t.true(response.data.includes('<script src="/nodecg-api.min.js">'));
	t.true(response.data.includes('<script src="/socket.io/socket.io.js"></script>'));
});
