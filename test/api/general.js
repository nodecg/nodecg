'use strict';

// Packages
const test = require('ava');

// Ours
require('../helpers/nodecg-and-webdriver')(test, ['dashboard']); // Must be first.
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
