'use strict';

// Packages
const test = require('ava');
const express = require('express');
const axios = require('axios');

// Ours
require('../helpers/nodecg-and-webdriver')(test, {tabs: ['dashboard']}); // Must be first.
const C = require('../helpers/test-constants');
const e = require('../helpers/test-environment');

test.serial('should receive messages and fire acknowledgements', async t => {
	e.apis.extension.listenFor('clientToServer', (data, cb) => cb());
	await e.browser.client.executeAsync(done => {
		return window.dashboardApi.sendMessage('clientToServer', null, done);
	});
	t.pass();
});

test.serial('should serialize errors sent to acknowledgements', async t => {
	e.apis.extension.listenFor('ackErrors', (data, cb) => cb(new Error('boom')));
	const res = await e.browser.client.executeAsync(done => {
		window.dashboardApi.sendMessage('ackErrors', null, err => {
			done(err.message);
		});
	});
	t.is(res.value, 'boom');
});

test.serial('should resolve acknowledgement promises', async t => {
	e.apis.extension.listenFor('ackPromiseResolve', (data, cb) => cb());
	const res = await e.browser.client.executeAsync(done => {
		window.dashboardApi.sendMessage('ackPromiseResolve').then(() => {
			done();
		}).catch(done);
	});
	t.is(res.value, null);
});

test.serial('should reject acknowledgement promises if there was an error', async t => {
	e.apis.extension.listenFor('ackPromiseReject', (data, cb) => cb(new Error('boom')));
	const res = await e.browser.client.executeAsync(done => {
		window.dashboardApi.sendMessage('ackPromiseReject').then(() => {
			done(new Error('Promise resolved when it should have rejected.'));
		}).catch(err => {
			done(err.message);
		});
	});
	t.is(res.value, 'boom');
});

test.serial('should not return a promise if the user provided a callback ', async t => {
	e.apis.extension.listenFor('ackPromiseCallback', (data, cb) => cb());
	const res = await e.browser.client.executeAsync(done => {
		const returnVal = window.dashboardApi.sendMessage('ackPromiseCallback', () => {
			done(returnVal === undefined);
		});
	});
	t.true(res.value);
});

test('should mount custom routes via nodecg.mount', async t => {
	const app = express();
	app.get('/test-bundle/test-route', (req, res) => {
		res.send('custom route confirmed');
	});
	e.apis.extension.mount(app);

	const response = await axios.get(`${C.ROOT_URL}test-bundle/test-route`);
	t.is(response.status, 200);
	t.is(response.data, 'custom route confirmed');
});

test.serial.cb('should support multiple listenFor handlers', t => {
	t.plan(2);
	let callbacksInvoked = 0;

	e.apis.extension.listenFor('multipleListenFor', () => {
		t.pass();
		checkDone();
	});

	e.apis.extension.listenFor('multipleListenFor', () => {
		t.pass();
		checkDone();
	});

	e.browser.client.execute(() => {
		return window.dashboardApi.sendMessage('multipleListenFor');
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

	e.apis.extension.listenFor('singleAckEnforcement', (data, cb) => {
		t.false(cb.handled);
		t.notThrows(cb);
		checkDone();
	});

	e.apis.extension.listenFor('singleAckEnforcement', (data, cb) => {
		t.true(cb.handled);
		t.throws(cb);
		checkDone();
	});

	e.browser.client.executeAsync(done => {
		return window.dashboardApi.sendMessage('singleAckEnforcement', null, done);
	});

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
	e.apis.extension.listenFor('serverToServer', data => {
		t.deepEqual(data, {foo: 'bar'});
	});

	// But, we also make sure that the client (browser) is still getting these messages as normal.
	await e.browser.client.execute(() => {
		window.dashboardApi.listenFor('serverToServer', data => {
			window._serverToServerData = data;
		});
	});

	// Send the message only after both listeners have been set up.
	e.apis.extension.sendMessage('serverToServer', {foo: 'bar'});

	// Wait until the browser has received the message.
	await e.browser.client.waitUntil(async () => {
		const response = await e.browser.client.execute(() => {
			return window._serverToServerData;
		});

		return response && response.value &&
			typeof response.value === 'object' &&
			Object.keys(response.value).length > 0;
	});

	// Verify that the browser got the right data along with the message.
	const response = await e.browser.client.execute(() => {
		return window._serverToServerData;
	});
	t.deepEqual(response.value, {foo: 'bar'});
});

test.serial('client - should support intra-context messaging', async t => {
	t.plan(2);

	// But, we also want to make sure that the server (extension) is still getting these messages as normal.
	e.apis.extension.listenFor('clientToClient', data => {
		t.deepEqual(data, {baz: 'qux'});
	});

	// But, we also make sure that the client (browser) is still getting these messages as normal.
	const response = await e.browser.client.executeAsync(done => {
		window.dashboardApi.listenFor('clientToClient', data => {
			done(data);
		});

		// Send the message only after both listeners have been set up.
		window.dashboardApi.sendMessage('clientToClient', {baz: 'qux'});
	});
	t.deepEqual(response.value, {baz: 'qux'});
});

test.serial('server - #bundleGit', t => {
	t.deepEqual(e.apis.extension.bundleGit, {
		branch: 'master',
		date: new Date('2018-07-13T17:09:29.000Z'),
		hash: '6262681c7f35eccd7293d57a50bdd25e4cd90684',
		message: 'Initial commit',
		shortHash: '6262681'
	});
});
