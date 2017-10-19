'use strict';

// Packages
const test = require('ava');

// Ours
require('../helpers/nodecg-and-webdriver')(test, ['dashboard']); // Must be first.
const e = require('../helpers/test-environment');

test.serial('should ensure that duplicate bundleName-messageName pairs are ignored', t => {
	const error = t.throws(() => {
		const cb = function () {};
		e.apis.extension.listenFor('testMessageName', 'testBundleName', cb);
		e.apis.extension.listenFor('testMessageName', 'testBundleName', cb);
	}, Error);

	t.is(
		error.message,
		'test-bundle attempted to declare a duplicate "listenFor" handler: testBundleName:testMessageName'
	);
});

test.serial('should produce an error if a callback isn\'t given', t => {
	const error = t.throws(() => {
		e.apis.extension.listenFor('testMessageName', 'test');
	}, Error);

	t.is(error.message, 'argument "handler" must be a function, but you provided a(n) string');
});

// Check for basic connectivity. The rest of the tests are run from the dashboard as well.
test.serial('should receive messages', async t => {
	await e.browser.client.execute(() => {
		window.serverToDashboardReceived = false;
		window.dashboardApi.listenFor('serverToDashboard', () => {
			window.serverToDashboardReceived = true;
		});
	});

	const sendMessageInterval = setInterval(() => {
		e.apis.extension.sendMessage('serverToDashboard');
	}, 500);

	await e.browser.client.executeAsync(done => {
		const checkMessageReceived = setInterval(() => {
			if (window.serverToDashboardReceived) {
				clearInterval(checkMessageReceived);
				done();
			}
		}, 50);
	});

	clearInterval(sendMessageInterval);
	t.pass();
});

test.cb.serial('should send messages', t => {
	e.apis.extension.listenFor('dashboardToServer', t.end);
	e.browser.client.execute(() => window.dashboardApi.sendMessage('dashboardToServer'));
});
