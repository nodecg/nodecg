'use strict';

// Packages
const test = require('ava');

// Ours
require('../helpers/nodecg-and-webdriver')(test, ['dashboard']); // Must be first.
const e = require('../helpers/test-environment');

test('should receive messages and fire acknowledgements', async t => {
	e.apis.extension.listenFor('clientToServer', (data, cb) => cb());
	await e.browser.client.executeAsync(done => {
		return window.dashboardApi.sendMessage('clientToServer', null, done);
	});
	t.pass();
});

test('should serialize errors sent to acknowledgements', async t => {
	e.apis.extension.listenFor('ackErrors', (data, cb) => cb(new Error('boom')));
	const res = await e.browser.client.executeAsync(done => {
		window.dashboardApi.sendMessage('ackErrors', null, err => {
			done(err.message);
		});
	});
	t.is(res.value, 'boom');
});

test('should resolve acknowledgement promises', async t => {
	e.apis.extension.listenFor('ackPromiseResolve', (data, cb) => cb());
	const res = await e.browser.client.executeAsync(done => {
		window.dashboardApi.sendMessage('ackPromiseResolve').then(() => {
			done();
		}).catch(done);
	});
	t.is(res.value, null);
});

test('should reject acknowledgement promises if there was an error', async t => {
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

test('should not resolve nor reject the promise if the user provided a callback', async t => {
	e.apis.extension.listenFor('ackPromiseCallback', (data, cb) => cb());
	const res = await e.browser.client.executeAsync(done => {
		window.dashboardApi.sendMessage('ackPromiseCallback', () => {
			// Delay this so that it fires after the promise would resolve.
			setTimeout(() => {
				done();
			}, 10);
		}).then(() => {
			done('promise resolved when it should not');
		}).catch(done);
	});
	t.is(res.value, null);
});
