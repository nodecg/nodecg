'use strict';

// Packages
const test = require('ava');

// Ours
require('../helpers/nodecg-and-webdriver')(test, {tabs: ['graphic']}); // Must be first.
const e = require('../helpers/test-environment');

test.beforeEach(async () => {
	await e.browser.client.switchTab(e.browser.tabs.graphic);
});

// The graphic and dashboard APIs use the same file
// If dashboard API passes all its tests, we just need to make sure that the socket works
test.serial('should receive messages', async t => {
	await e.browser.client.execute(() => {
		window.serverToGraphicReceived = false;
		window.graphicApi.listenFor('serverToGraphic', () => {
			window.serverToGraphicReceived = true;
		});
	});

	const sendMessageInterval = setInterval(() => {
		e.apis.extension.sendMessage('serverToGraphic');
	}, 500);

	await e.browser.client.executeAsync(done => {
		const checkMessageReceived = setInterval(() => {
			if (window.serverToGraphicReceived) {
				clearInterval(checkMessageReceived);
				done();
			}
		}, 50);
	});

	clearInterval(sendMessageInterval);
	t.pass();
});

test.cb.serial('should send messages', t => {
	e.apis.extension.listenFor('graphicToServer', t.end);
	e.browser.client.execute(() => window.graphicApi.sendMessage('graphicToServer'));
});

test.serial('#bundleVersion', async t => {
	const res = await e.browser.client.execute(() => {
		return window.graphicApi.bundleVersion;
	});
	t.is(res.value, '0.0.1');
});

test.serial('#bundleGit', async t => {
	const res = await e.browser.client.execute(() => {
		return window.graphicApi.bundleGit;
	});
	t.deepEqual(res.value, {
		branch: 'master',
		date: '2018-07-13T17:09:29.000Z',
		hash: '6262681c7f35eccd7293d57a50bdd25e4cd90684',
		message: 'Initial commit',
		shortHash: '6262681'
	});
});
