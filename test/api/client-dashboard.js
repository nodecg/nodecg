'use strict';

// Packages
const test = require('ava');

// Ours
require('../helpers/nodecg-and-webdriver')(test, {tabs: ['dashboard']}); // Must be first.
const e = require('../helpers/test-environment');

test.serial('should produce an error if a callback isn\'t given', t => {
	const error = t.throws(() => {
		e.apis.extension.listenFor('testMessageName', 'test');
	}, Error);

	t.is(error.message, 'argument "handler" must be a function, but you provided a(n) string');
});

// Check for basic connectivity. The rest of the tests are run from the dashboard as well.
test.serial('should receive messages', async t => {
	await e.browser.tabs.dashboard.evaluate(() => {
		window.serverToDashboardReceived = false;
		window.dashboardApi.listenFor('serverToDashboard', () => {
			window.serverToDashboardReceived = true;
		});
	});

	const sendMessageInterval = setInterval(() => {
		e.apis.extension.sendMessage('serverToDashboard');
	}, 500);

	await e.browser.tabs.dashboard.evaluate(() => new Promise(resolve => {
		const checkMessageReceived = setInterval(() => {
			if (window.serverToDashboardReceived) {
				clearInterval(checkMessageReceived);
				resolve();
			}
		}, 50);
	}));

	clearInterval(sendMessageInterval);
	t.pass();
});

test.cb.serial('should send messages', t => {
	e.apis.extension.listenFor('dashboardToServer', t.end);
	e.browser.tabs.dashboard.evaluate(() => {
		window.dashboardApi.sendMessage('dashboardToServer')
	});
});

test.serial('should support multiple listenFor handlers', async t => {
	// Set up the listenFor handlers.
	await e.browser.tabs.dashboard.evaluate(() => {
		let callbacksInvoked = 0;
		window.dashboardApi.listenFor('serverToDashboardMultiple', () => {
			checkDone();
		});

		window.dashboardApi.listenFor('serverToDashboardMultiple', () => {
			checkDone();
		});

		function checkDone() {
			callbacksInvoked++;
			window.__serverToDashboardMultipleDone__ = callbacksInvoked === 2;
		}
	});

	// Send the message from the server to the clients.
	e.apis.extension.sendMessage('serverToDashboardMultiple');

	// Verify that our handlers both ran.
	const res = await e.browser.tabs.dashboard.evaluate(() => {
		return window.__serverToDashboardMultipleDone__;
	});
	t.true(res);
});

test.serial('#bundleVersion', async t => {
	const res = await e.browser.tabs.dashboard.evaluate(() => {
		return window.dashboardApi.bundleVersion;
	});
	t.is(res, '0.0.1');
});

test.serial('#bundleGit', async t => {
	const res = await e.browser.tabs.dashboard.evaluate(() => {
		return window.dashboardApi.bundleGit;
	});
	t.deepEqual(res, {
		branch: 'master',
		date: '2018-07-13T17:09:29.000Z',
		hash: '6262681c7f35eccd7293d57a50bdd25e4cd90684',
		message: 'Initial commit',
		shortHash: '6262681'
	});
});
