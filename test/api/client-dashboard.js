'use strict';

// Packages
import test from 'ava';

// Ours
import * as server from '../helpers/server';
import * as browser from '../helpers/browser';

server.setup();
const {initDashboard} = browser.setup();

let dashboard;
test.before(async () => {
	dashboard = await initDashboard();
});

test.serial('should produce an error if a callback isn\'t given', t => {
	const error = t.throws(() => {
		t.context.apis.extension.listenFor('testMessageName', 'test');
	}, Error);

	t.is(error.message, 'argument "handler" must be a function, but you provided a(n) string');
});

// Check for basic connectivity. The rest of the tests are run from the dashboard as well.
test.serial('should receive messages', async t => {
	await dashboard.evaluate(() => {
		window.serverToDashboardReceived = false;
		window.dashboardApi.listenFor('serverToDashboard', () => {
			window.serverToDashboardReceived = true;
		});
	});

	const sendMessageInterval = setInterval(() => {
		t.context.apis.extension.sendMessage('serverToDashboard');
	}, 500);

	await dashboard.waitForFunction(() => window.serverToDashboardReceived);

	clearInterval(sendMessageInterval);
	t.pass();
});

test.serial.cb('should send messages', t => {
	setTimeout(() => {
		t.end('Timeout');
	}, 1000);
	t.context.apis.extension.listenFor('dashboardToServer', () => {
		t.end();
	});
	dashboard.evaluate(() => {
		window.dashboardApi.sendMessage('dashboardToServer');
	});
});

test.serial('should support multiple listenFor handlers', async t => {
	await dashboard.evaluate(() => {
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
	t.context.apis.extension.sendMessage('serverToDashboardMultiple');

	// Verify that our handlers both ran.
	const res = await dashboard.evaluate(() => window.__serverToDashboardMultipleDone__);
	t.true(res);
});

test.serial('#bundleVersion', async t => {
	const res = await dashboard.evaluate(() => {
		return window.dashboardApi.bundleVersion;
	});
	t.is(res, '0.0.1');
});

test.serial('#bundleGit', async t => {
	const res = await dashboard.evaluate(() => {
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
