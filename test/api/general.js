'use strict';

// Packages
import test from 'ava';
import * as axios from 'axios';
const express = require('express');

// Ours
import * as server from '../helpers/server';
import * as browser from '../helpers/browser';

server.setup();
const {initDashboard} = browser.setup();

import * as C from '../helpers/test-constants';

let dashboard;
test.before(async () => {
	dashboard = await initDashboard();
});

test.serial('should receive messages and fire acknowledgements', async t => {
	t.context.apis.extension.listenFor('clientToServer', (data, cb) => cb());
	await dashboard.evaluate(() => new Promise(resolve => {
		window.dashboardApi.sendMessage('clientToServer', null, resolve);
	}));
	t.pass();
});

test.serial('should serialize errors sent to acknowledgements', async t => {
	t.context.apis.extension.listenFor('ackErrors', (data, cb) => cb(new Error('boom')));
	const res = await dashboard.evaluate(() => new Promise(resolve => {
		window.dashboardApi.sendMessage('ackErrors', null, err => {
			resolve(err.message);
		});
	}));
	t.is(res, 'boom');
});

test.serial('should resolve acknowledgement promises', async t => {
	t.context.apis.extension.listenFor('ackPromiseResolve', (data, cb) => cb());
	const res = await dashboard.evaluate(() =>
		window.dashboardApi.sendMessage('ackPromiseResolve').catch());
	t.is(res, undefined);
});

test.serial('should reject acknowledgement promises if there was an error', async t => {
	t.context.apis.extension.listenFor('ackPromiseReject', (data, cb) => cb(new Error('boom')));
	const res = await dashboard.evaluate(() =>
		window.dashboardApi.sendMessage('ackPromiseReject')
			.then(() => new Error('Promise resolved when it should have rejected.'))
			.catch(err => err.message));
	t.is(res, 'boom');
});

test.serial('should not return a promise if the user provided a callback ', async t => {
	t.context.apis.extension.listenFor('ackPromiseCallback', (data, cb) => cb());
	const res = await dashboard.evaluate(() => new Promise(resolve => {
		const returnVal = window.dashboardApi.sendMessage('ackPromiseCallback', () => {
			resolve(returnVal === undefined);
		});
	}));
	t.true(res);
});

test('should mount custom routes via nodecg.mount', async t => {
	const app = express();
	app.get('/test-bundle/test-route', (req, res) => {
		res.send('custom route confirmed');
	});
	t.context.apis.extension.mount(app);

	const response = await axios.get(`${C.rootUrl()}test-bundle/test-route`);
	t.is(response.status, 200);
	t.is(response.data, 'custom route confirmed');
});

test.serial.cb('should support multiple listenFor handlers', t => {
	t.plan(2);
	let callbacksInvoked = 0;

	t.context.apis.extension.listenFor('multipleListenFor', () => {
		t.pass();
		checkDone();
	});

	t.context.apis.extension.listenFor('multipleListenFor', () => {
		t.pass();
		checkDone();
	});

	dashboard.evaluate(() => {
		window.dashboardApi.sendMessage('multipleListenFor');
	});

	function checkDone() {
		callbacksInvoked++;
		if (callbacksInvoked === 2) {
			t.end();
		}
	}
});

test.serial.cb('should prevent acknowledgements from being called more than once', t => {
	t.plan(4);
	let callbacksInvoked = 0;

	t.context.apis.extension.listenFor('singleAckEnforcement', (data, cb) => {
		t.false(cb.handled);
		t.notThrows(cb);
		checkDone();
	});

	t.context.apis.extension.listenFor('singleAckEnforcement', (data, cb) => {
		t.true(cb.handled);
		t.throws(cb);
		checkDone();
	});

	dashboard.evaluate(() => new Promise(resolve => {
		return window.dashboardApi.sendMessage('singleAckEnforcement', null, resolve);
	}));

	function checkDone() {
		callbacksInvoked++;
		if (callbacksInvoked === 2) {
			t.end();
		}
	}
});

test.serial('server - should support intra-context messaging', async t => {
	t.plan(2);

	// This is what we're actually testing.
	t.context.apis.extension.listenFor('serverToServer', data => {
		t.deepEqual(data, {foo: 'bar'});
	});

	// But, we also make sure that the client (browser) is still getting these messages as normal.
	await dashboard.evaluate(() => {
		window.dashboardApi.listenFor('serverToServer', data => {
			window._serverToServerData = data;
		});
	});

	// Send the message only after both listeners have been set up.
	t.context.apis.extension.sendMessage('serverToServer', {foo: 'bar'});

	// Wait until the browser has received the message.
	await dashboard.waitForFunction(async () => {
		const data = window._serverToServerData;
		return typeof data === 'object' && Object.keys(data).length > 0;
	});

	// Verify that the browser got the right data along with the message.
	const response = await dashboard.evaluate(() => {
		return window._serverToServerData;
	});
	t.deepEqual(response, {foo: 'bar'});
});

test.serial('client - should support intra-context messaging', async t => {
	t.plan(2);

	// We also want to make sure that the server (extension) is still getting these messages as normal.
	t.context.apis.extension.listenFor('clientToClient', data => {
		t.deepEqual(data, {baz: 'qux'});
	});

	const response = await dashboard.evaluate(() => new Promise(resolve => {
		window.dashboardApi.listenFor('clientToClient', data => {
			resolve(data);
		});

		// Send the message only after both listeners have been set up.
		window.dashboardApi.sendMessage('clientToClient', {baz: 'qux'});
	}));
	t.deepEqual(response, {baz: 'qux'});
});

test('server - #bundleVersion', t => {
	t.is(t.context.apis.extension.bundleVersion, '0.0.1');
});

test('server - #bundleGit', t => {
	t.deepEqual(t.context.apis.extension.bundleGit, {
		branch: 'master',
		date: new Date('2018-07-13T17:09:29.000Z'),
		hash: '6262681c7f35eccd7293d57a50bdd25e4cd90684',
		message: 'Initial commit',
		shortHash: '6262681'
	});
});

test('bundles replicant', t => {
	const bundlesRep = t.context.apis.extension.Replicant('bundles', 'nodecg');
	t.is(bundlesRep.value.length, 5);
});
