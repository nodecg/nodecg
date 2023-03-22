// Packages
import type { TestFn } from 'ava';
import anyTest from 'ava';
import fetch from 'node-fetch-commonjs';
import express from 'express';
import type * as puppeteer from 'puppeteer';

// Ours
import * as server from '../helpers/server';
import * as browser from '../helpers/browser';
import { invokeAck } from '../helpers/utilities';

const test = anyTest as TestFn<browser.BrowserContext & server.ServerContext>;
server.setup();
const { initDashboard } = browser.setup();

import * as C from '../helpers/test-constants';
import type { NodeCG } from '../../src/types/nodecg';

let dashboard: puppeteer.Page;
test.before(async () => {
	dashboard = await initDashboard();
});

test.serial('should receive messages and fire acknowledgements', async (t) => {
	t.context.apis.extension.listenFor('clientToServer', (_, cb) => {
		invokeAck(t, cb, null);
	});
	await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.sendMessage('clientToServer', null, resolve);
			}),
	);
	t.pass();
});

test.serial('should serialize errors sent to acknowledgements', async (t) => {
	t.context.apis.extension.listenFor('ackErrors', (_, cb) => {
		invokeAck(t, cb, new Error('boom'));
	});
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.sendMessage('ackErrors', null, (err: any) => {
					resolve(err.message);
				});
			}),
	);
	t.is(res, 'boom');
});

test.serial('should resolve acknowledgement promises', async (t) => {
	t.context.apis.extension.listenFor('ackPromiseResolve', (_, cb) => {
		invokeAck(t, cb);
	});
	const res = await dashboard.evaluate(async () => window.dashboardApi.sendMessage('ackPromiseResolve').catch());
	t.deepEqual(res, undefined);
});

test.serial('should reject acknowledgement promises if there was an error', async (t) => {
	t.context.apis.extension.listenFor('ackPromiseReject', (_, cb) => {
		invokeAck(t, cb, new Error('boom'));
	});
	const res = await dashboard.evaluate(async () =>
		window.dashboardApi
			.sendMessage('ackPromiseReject')
			.then(() => new Error('Promise resolved when it should have rejected.'))
			.catch((err) => err.message),
	);
	t.is(res, 'boom');
});

test.serial('should not return a promise if the user provided a callback ', async (t) => {
	t.context.apis.extension.listenFor('ackPromiseCallback', (_, cb) => {
		invokeAck(t, cb);
	});
	const res = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				// eslint-disable-next-line @typescript-eslint/no-confusing-void-expression
				const returnVal = window.dashboardApi.sendMessage('ackPromiseCallback', () => {
					resolve(returnVal === undefined);
				});
			}),
	);
	t.true(res);
});

test('should mount custom routes via nodecg.mount', async (t) => {
	const app = express();
	app.get('/test-bundle/test-route', (_, res) => {
		res.send('custom route confirmed');
	});
	t.context.apis.extension.mount(app);

	const response = await fetch(`${C.rootUrl()}test-bundle/test-route`);
	t.is(response.status, 200);
	t.is(await response.text(), 'custom route confirmed');
});

test('should mount prefixed custom routes via nodecg.mount', async (t) => {
	const app = express();
	app.get('/test-route', (_, res) => {
		res.send('custom route confirmed');
	});
	t.context.apis.extension.mount('/test-bundle', app);

	const response = await fetch(`${C.rootUrl()}test-bundle/test-route`);
	t.is(response.status, 200);
	t.is(await response.text(), 'custom route confirmed');
});

test('should mount custom routes via the built-in router and nodecg.mount', async (t) => {
	const app = t.context.apis.extension.Router();
	app.get('/test-bundle/test-route', (_, res) => {
		res.send('custom route confirmed');
	});
	t.context.apis.extension.mount(app);

	const response = await fetch(`${C.rootUrl()}test-bundle/test-route`);
	t.is(response.status, 200);
	t.is(await response.text(), 'custom route confirmed');
});

test.serial('should support multiple listenFor handlers', async (t) => {
	t.plan(2);
	let callbacksInvoked = 0;

	t.context.apis.extension.listenFor('multipleListenFor', () => {
		t.pass();
		callbacksInvoked++;
	});

	t.context.apis.extension.listenFor('multipleListenFor', () => {
		t.pass();
		callbacksInvoked++;
	});

	void dashboard.evaluate(() => {
		void window.dashboardApi.sendMessage('multipleListenFor');
	});

	return new Promise<void>((resolve) => {
		setInterval(() => {
			if (callbacksInvoked === 2) {
				resolve();
			}
		}, 100);
	});
});

test.serial('should prevent acknowledgements from being called more than once', async (t) => {
	t.plan(3);
	let callbacksInvoked = 0;

	t.context.apis.extension.listenFor('singleAckEnforcement', (_, cb) => {
		if (!cb) {
			t.fail('no callback');
			return;
		}

		if (cb.handled) {
			t.fail('callback already handled');
			return;
		}

		t.notThrows(cb);
		callbacksInvoked++;
	});

	t.context.apis.extension.listenFor('singleAckEnforcement', (_, cb) => {
		if (!cb) {
			t.fail('no callback');
			return;
		}

		t.true(cb.handled);
		// @ts-expect-error We are testing to see if something throws an error.
		t.throws(cb);
		callbacksInvoked++;
	});

	void dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.sendMessage('singleAckEnforcement', null, resolve);
			}),
	);

	return new Promise<void>((resolve) => {
		setInterval(() => {
			if (callbacksInvoked === 2) {
				resolve();
			}
		}, 100);
	});
});

test.serial('server - should support intra-context messaging', async (t) => {
	let assertCount = 0;
	const incrementAssert = (): void => {
		if (++assertCount === 2) {
			t.pass();
		}
	};

	t.plan(3);

	// This is what we're actually testing.
	t.context.apis.extension.listenFor('serverToServer', (data) => {
		t.deepEqual(data, { foo: 'bar' });
		incrementAssert();
	});

	// But, we also make sure that the client (browser) is still getting these messages as normal.
	await dashboard.evaluate(() => {
		window.dashboardApi.listenFor('serverToServer', (data) => {
			console.log('got message:', data);
			(window as any)._serverToServerData = data;
		});
	});

	// Send the message only after both listeners have been set up.
	t.context.apis.extension.sendMessage('serverToServer', { foo: 'bar' });

	// Wait until the browser has received the message.
	await dashboard.waitForFunction(() => {
		const data = (window as any)._serverToServerData;
		return typeof data === 'object' && Object.keys(data).length > 0;
	});

	// Verify that the browser got the right data along with the message.
	const response = await dashboard.evaluate(() => (window as any)._serverToServerData);
	t.deepEqual(response, { foo: 'bar' });
	incrementAssert();
});

test.serial('client - should support intra-context messaging', async (t) => {
	t.plan(2);

	let assertCount = 0;

	// We also want to make sure that the server (extension) is still getting these messages as normal.
	t.context.apis.extension.listenFor('clientToClient', (data) => {
		t.deepEqual(data, { baz: 'qux' });
		assertCount++;
	});

	const response = await dashboard.evaluate(
		async () =>
			new Promise((resolve) => {
				window.dashboardApi.listenFor('clientToClient', (data) => {
					resolve(data);
				});

				// Send the message only after both listeners have been set up.
				void window.dashboardApi.sendMessage('clientToClient', { baz: 'qux' });
			}),
	);
	t.deepEqual(response, { baz: 'qux' });
	assertCount++;

	return new Promise<void>((resolve) => {
		setInterval(() => {
			if (assertCount === 2) {
				resolve();
			}
		}, 100);
	});
});

test('server - #bundleVersion', (t) => {
	t.is(t.context.apis.extension.bundleVersion, '0.0.1');
});

test('server - #bundleGit', (t) => {
	t.deepEqual(t.context.apis.extension.bundleGit, {
		branch: 'master',
		date: '2018-07-13T17:09:29.000Z',
		hash: '6262681c7f35eccd7293d57a50bdd25e4cd90684',
		message: 'Initial commit',
		shortHash: '6262681',
	});
});

test('bundles replicant', (t) => {
	const bundlesRep = t.context.apis.extension.Replicant<NodeCG.Bundle[]>('bundles', 'nodecg');
	t.is(bundlesRep.value?.length, 5);
});
