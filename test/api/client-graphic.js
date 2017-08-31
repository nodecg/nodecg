'use strict';

// Packages
const test = require('ava');

// Ours
require('../helpers/nodecg-and-webdriver')(test, ['graphic']); // Must be first.
const e = require('../helpers/test-environment');

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
