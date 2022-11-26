// Packages
import type { TestFn } from 'ava';
import anyTest from 'ava';
import type * as puppeteer from 'puppeteer';

// Ours
import * as server from '../helpers/server';
import * as browser from '../helpers/browser';

server.setup();
const { initDashboard } = browser.setup();
const test = anyTest as TestFn<browser.BrowserContext & server.ServerContext>;

let dashboard: puppeteer.Page;
test.before(async () => {
	dashboard = await initDashboard();
});

test.serial("should produce an error if a callback isn't given", (t) => {
	const error = t.throws(() => {
		t.context.apis.extension.listenFor(
			'testMessageName',
			// @ts-expect-error
			'test',
		);
	});

	if (!error) return t.fail();
	return t.is(error.message, 'argument "handler" must be a function, but you provided a(n) undefined');
});

// Check for basic connectivity. The rest of the tests are run from the dashboard as well.
test.serial('should receive messages', async (t) => {
	await dashboard.evaluate(() => {
		(window as any).serverToDashboardReceived = false;
		window.dashboardApi.listenFor('serverToDashboard', () => {
			(window as any).serverToDashboardReceived = true;
		});
	});

	const sendMessageInterval = setInterval(() => {
		t.context.apis.extension.sendMessage('serverToDashboard');
	}, 500);

	await dashboard.waitForFunction(() => (window as any).serverToDashboardReceived);

	clearInterval(sendMessageInterval);
	t.pass();
});

test.serial('should send messages', async (t) => {
	t.plan(1);
	const timeout = setTimeout(() => {
		t.fail('Timeout');
	}, 1000);
	const promise = new Promise<void>((resolve) => {
		t.context.apis.extension.listenFor('dashboardToServer', () => {
			clearTimeout(timeout);
			t.pass();
			resolve();
		});
	});
	void dashboard.evaluate(() => {
		void window.dashboardApi.sendMessage('dashboardToServer');
	});
	return promise;
});

test.serial('should support multiple listenFor handlers', async (t) => {
	await dashboard.evaluate(() => {
		let callbacksInvoked = 0;
		window.dashboardApi.listenFor('serverToDashboardMultiple', () => {
			checkDone();
		});

		window.dashboardApi.listenFor('serverToDashboardMultiple', () => {
			checkDone();
		});

		function checkDone(): void {
			callbacksInvoked++;
			(window as any).__serverToDashboardMultipleDone__ = callbacksInvoked === 2;
		}
	});

	// Send the message from the server to the clients.
	t.context.apis.extension.sendMessage('serverToDashboardMultiple');

	// Verify that our handlers both ran.
	await dashboard.waitForFunction(() => (window as any).__serverToDashboardMultipleDone__);
	t.pass();
});

test.serial('#bundleVersion', async (t) => {
	const res = await dashboard.evaluate(() => window.dashboardApi.bundleVersion);
	t.is(res, '0.0.1');
});

test.serial('#bundleGit', async (t) => {
	const res = await dashboard.evaluate(() => window.dashboardApi.bundleGit);
	t.deepEqual(res, {
		branch: 'master',
		date: '2018-07-13T17:09:29.000Z',
		hash: '6262681c7f35eccd7293d57a50bdd25e4cd90684',
		message: 'Initial commit',
		shortHash: '6262681',
	});
});
