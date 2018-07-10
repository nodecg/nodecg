'use strict';

// Packages
const test = require('ava');
const axios = require('axios');

// Ours
require('./helpers/nodecg-and-webdriver')(test, {tabs: ['dashboard', 'single-instance']}); // Must be first.
const C = require('./helpers/test-constants');
const e = require('./helpers/test-environment');

test.beforeEach(async () => {
	await e.browser.client.switchTab(e.browser.tabs.singleInstance);
});

test('scripts get injected into /instance/*.html routes', async t => {
	const response = await axios.get(`${C.ROOT_URL}instance/killed.html`);
	t.is(response.status, 200);
	t.true(response.data.includes('<script src="/nodecg-api.min.js">'));
	t.true(response.data.includes('<script src="/socket.io/socket.io.js"></script>'));
});

test.serial.cb('shouldn\'t enter an infinite redirect loop when including a polymer element that loads an external stylesheet', t => {
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

test.serial('should redirect to busy.html when the instance is already taken', async t => {
	await e.browser.client.newWindow(C.SINGLE_INSTANCE_URL);
	await e.sleep(250);
	t.is(
		await e.browser.client.getUrl(),
		`${C.ROOT_URL}instance/busy.html?path=/bundles/test-bundle/graphics/single_instance.html`
	);
});

test.serial('should redirect to killed.html when the instance is killed', async t => {
	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	await e.browser.client.execute(() => {
		document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-graphics').shadowRoot
			.querySelector('ncg-single-instance').$.kill.click();
	});

	await e.browser.client.switchTab(e.browser.tabs.singleInstance);
	t.is(
		await e.browser.client.getUrl(),
		`${C.ROOT_URL}instance/killed.html?path=/bundles/test-bundle/graphics/single_instance.html`
	);
});

test.serial('should allow the graphic to be taken after being killed', async t => {
	await e.browser.client.newWindow(C.SINGLE_INSTANCE_URL);
	t.is(await e.browser.client.getUrl(), C.SINGLE_INSTANCE_URL);
});
