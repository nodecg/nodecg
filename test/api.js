/* eslint-env node, mocha, browser */
/* eslint-disable max-nested-callbacks */
'use strict';

const request = require('request');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const e = require('./setup/test-environment');
const C = require('./setup/test-constants');

describe('api', function () {
	this.timeout(10000);

	beforeEach(() => {
		return e.browser.client.switchTab(e.browser.tabs.dashboard);
	});

	it('should receive messages and fire acknowledgements', async () => {
		e.apis.extension.listenFor('clientToServer', (data, cb) => cb());
		return e.browser.client.executeAsync(done => {
			return window.dashboardApi.sendMessage('clientToServer', null, done);
		});
	});

	it('should serialize errors sent to acknowledgements', async () => {
		e.apis.extension.listenFor('ackErrors', (data, cb) => cb(new Error('boom')));
		const res = await e.browser.client.executeAsync(done => {
			window.dashboardApi.sendMessage('ackErrors', null, err => {
				done(err.message);
			});
		});
		assert.equal(res.value, 'boom');
	});

	it('should resolve acknowledgement promises', async () => {
		e.apis.extension.listenFor('ackPromiseResolve', (data, cb) => cb());
		const res = await e.browser.client.executeAsync(done => {
			window.dashboardApi.sendMessage('ackPromiseResolve').then(() => {
				done();
			}).catch(done);
		});
		assert.isNull(res.value);
	});

	it('should reject acknowledgement promises if there was an error', async () => {
		e.apis.extension.listenFor('ackPromiseReject', (data, cb) => cb(new Error('boom')));
		const res = await e.browser.client.executeAsync(done => {
			window.dashboardApi.sendMessage('ackPromiseReject').then(() => {
				done(new Error('Promise resolved when it should have rejected.'));
			}).catch(err => {
				done(err.message);
			});
		});
		assert.equal(res.value, 'boom');
	});

	it('should not resolve nor reject the promise if the user provided a callback', async () => {
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
		assert.isNull(res.value);
	});
});

describe('client-side api', function () {
	this.timeout(10000);

	beforeEach(() => {
		return e.browser.client.switchTab(e.browser.tabs.dashboard);
	});

	context('on the dashboard', () => {
		it('should ensure that duplicate bundleName-messageName pairs are ignored', () => {
			assert.throws(() => {
				const cb = function () {};
				e.apis.extension.listenFor('testMessageName', 'testBundleName', cb);
				e.apis.extension.listenFor('testMessageName', 'testBundleName', cb);
			}, Error, 'test-bundle attempted to declare a duplicate "listenFor" handler: testBundleName:testMessageName');
		});

		it('should produce an error if a callback isn\'t given', () => {
			assert.throws(() => {
				e.apis.extension.listenFor('testMessageName', 'test');
			}, Error, 'argument "handler" must be a function, but you provided a(n) string');
		});

		// Check for basic connectivity. The rest of the tests are run from the dashboard as well.
		it('should receive messages', async () => {
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
		});

		it('should send messages', done => {
			e.apis.extension.listenFor('dashboardToServer', done);
			e.browser.client.execute(() => window.dashboardApi.sendMessage('dashboardToServer'));
		});
	});

	context('in a graphic', () => {
		beforeEach(() => {
			return e.browser.client.switchTab(e.browser.tabs.graphic);
		});

		// The graphic and dashboard APIs use the same file
		// If dashboard API passes all its tests, we just need to make sure that the socket works
		it('should receive messages', async () => {
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
		});

		it('should send messages', done => {
			e.apis.extension.listenFor('graphicToServer', done);
			e.browser.client.execute(() => window.graphicApi.sendMessage('graphicToServer'));
		});
	});

	describe('#config', () => {
		it('should exist and have length', async () => {
			const res = await e.browser.client.execute(() => {
				return window.dashboardApi.config;
			});
			assert.isAbove(Object.keys(res.value).length, 0);
		});

		it('shouldn\'t reveal sensitive information', async () => {
			const res = await e.browser.client.execute(() => {
				return window.dashboardApi.config;
			});
			expect(res.value.login).to.not.have.property('sessionSecret');
		});

		it('shouldn\'t be writable', async () => {
			const res = await e.browser.client.execute(() => {
				return Object.isFrozen(window.dashboardApi.config);
			});
			assert.isTrue(res.value);
		});
	});

	describe('#bundleConfig', () => {
		it('should exist and have length', async () => {
			const res = await e.browser.client.execute(() => {
				return window.dashboardApi.bundleConfig;
			});
			assert.isAbove(Object.keys(res.value).length, 0);
		});
	});

	describe('#Logger', () => {
		it('should exist and be the Logger constructor', async () => {
			const res = await e.browser.client.execute(() => {
				return window.dashboardApi.Logger && typeof window.dashboardApi.Logger === 'function';
			});
			assert.isTrue(res.value);
		});
	});

	describe('#getDialog', () => {
		it('works', async () => {
			const res = await e.browser.client.execute(() => {
				const dialog = window.dashboardApi.getDialog('test-dialog');
				return dialog && dialog.tagName === 'NCG-DIALOG';
			});
			assert.isTrue(res.value);
		});
	});

	describe('#getDialogDocument', () => {
		it('works', async () => {
			const res = await e.browser.client.execute(() => {
				const document = window.dashboardApi.getDialogDocument('test-dialog');
				return document && document.body && document.body.tagName === 'BODY';
			});
			assert.isTrue(res.value);
		});
	});

	describe('#unlisten', () => {
		it('works', async () => {
			const res = await e.browser.client.execute(() => {
				const handlerFunc = function () {};
				window.dashboardApi.listenFor('unlisten', handlerFunc);
				return window.dashboardApi.unlisten('unlisten', handlerFunc);
			});
			assert.isTrue(res.value);
		});
	});
});

describe('server-side api', () => {
	it('should send messages', async function () {
		this.timeout(10000);

		await e.browser.client.switchTab(e.browser.tabs.dashboard);
		await e.browser.client.execute(() => {
			window.serverToClientReceived = false;
			window.dashboardApi.listenFor('serverToClient', () => {
				window.serverToClientReceived = true;
			});
		});

		const sendMessageInterval = setInterval(() => {
			e.apis.extension.sendMessage('serverToClient');
		}, 500);

		await e.browser.client.executeAsync(done => {
			const checkMessageReceived = setInterval(() => {
				if (window.serverToClientReceived) {
					clearInterval(checkMessageReceived);
					done();
				}
			}, 50);
		});

		clearInterval(sendMessageInterval);
	});

	it('should mount express middleware', done => {
		request(`${C.DASHBOARD_URL}/test-bundle/test-route`, (error, response) => {
			assert.isNull(error);
			expect(response.statusCode).to.equal(200);
			done();
		});
	});

	describe('#config', () => {
		it('should exist and have length', () => {
			assert.isAbove(Object.keys(e.apis.extension.config).length, 0);
		});

		it('shouldn\'t reveal sensitive information', () => {
			expect(e.apis.extension.config.login).to.not.have.property('sessionSecret');
		});

		it('shouldn\'t be writable', () => {
			assert.isTrue(Object.isFrozen(e.apis.extension.config));
		});
	});

	describe('#bundleConfig', () => {
		it('should exist and has length', () => {
			assert.isAbove(Object.keys(e.apis.extension.bundleConfig).length, 0);
		});
	});

	describe('#Logger', () => {
		it('should exist and be the Logger constructor', () => {
			assert.isFunction(e.apis.extension.Logger);
		});
	});

	describe('#unlisten', () => {
		it('works', () => {
			const handlerFunc = function () {};
			e.apis.extension.listenFor('unlisten', handlerFunc);
			assert.isTrue(e.apis.extension.unlisten('unlisten', handlerFunc));
		});
	});
});
