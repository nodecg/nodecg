/* eslint-env node, mocha, browser */
/* eslint-disable max-nested-callbacks */
'use strict';

const request = require('request');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
const e = require('./setup/test-environment');
const C = require('./setup/test-constants');

describe('client-side api', function () {
	this.timeout(10000);

	context('on the dashboard', () => {
		before(done => {
			e.browser.client
				.switchTab(e.browser.tabs.dashboard)
				.call(done);
		});

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

		// Check for basic connectivity. The rest of the test are run from the dashboard as well.
		it('should receive messages', done => {
			let sendMessage;
			e.browser.client
				.execute(() => {
					window.serverToDashboardReceived = false;
					window.dashboardApi.listenFor('serverToDashboard', () => {
						window.serverToDashboardReceived = true;
					});
				})
				.then(() => {
					sendMessage = setInterval(() => {
						e.apis.extension.sendMessage('serverToDashboard');
					}, 500);
				})
				.executeAsync(done => {
					const checkMessageReceived = setInterval(() => {
						if (window.serverToDashboardReceived) {
							clearInterval(checkMessageReceived);
							done();
						}
					}, 50);
				})
				.then(() => {
					clearInterval(sendMessage);
					done();
				});
		});

		it('should send messages', done => {
			e.apis.extension.listenFor('dashboardToServer', done);
			e.browser.client
				.execute(() => window.dashboardApi.sendMessage('dashboardToServer'));
		});
	});

	context('in a graphic', () => {
		before(done => {
			e.browser.client
				.switchTab(e.browser.tabs.graphic)
				.call(done);
		});

		// The graphic and dashboard APIs use the same file
		// If dashboard API passes all its tests, we just need to make sure that the socket works
		it('should receive messages', done => {
			let sendMessage;
			e.browser.client
				.execute(() => {
					window.serverToGraphicReceived = false;
					window.graphicApi.listenFor('serverToGraphic', () => {
						window.serverToGraphicReceived = true;
					});
				})
				.then(() => {
					sendMessage = setInterval(() => {
						e.apis.extension.sendMessage('serverToGraphic');
					}, 500);
				})
				.executeAsync(done => {
					const checkMessageReceived = setInterval(() => {
						if (window.serverToGraphicReceived) {
							clearInterval(checkMessageReceived);
							done();
						}
					}, 50);
				})
				.then(() => {
					clearInterval(sendMessage);
					done();
				});
		});

		it('should send messages', done => {
			e.apis.extension.listenFor('graphicToServer', done);
			e.browser.client
				.execute(() => window.graphicApi.sendMessage('graphicToServer'));
		});
	});

	describe('#config', () => {
		before(done => {
			e.browser.client
				.switchTab(e.browser.tabs.dashboard)
				.call(done);
		});

		it('should exist and have length', done => {
			e.browser.client
				.execute(() => {
					return window.dashboardApi.config;
				})
				.then(ret => {
					assert.isAbove(Object.keys(ret.value).length, 0);
					done();
				});
		});

		it('shouldn\'t reveal sensitive information', done => {
			e.browser.client
				.execute(() => {
					return window.dashboardApi.config;
				})
				.then(ret => {
					expect(ret.value.login).to.not.have.property('sessionSecret');
					done();
				});
		});

		it('shouldn\'t be writable', done => {
			e.browser.client
				.execute(() => {
					return Object.isFrozen(window.dashboardApi.config);
				})
				.then(ret => {
					assert.isTrue(ret.value);
					done();
				});
		});
	});

	describe('#bundleConfig', () => {
		before(done => {
			e.browser.client
				.switchTab(e.browser.tabs.dashboard)
				.call(done);
		});

		it('should exist and have length', done => {
			e.browser.client
				.execute(() => {
					return window.dashboardApi.bundleConfig;
				})
				.then(ret => {
					assert.isAbove(Object.keys(ret.value).length, 0);
					done();
				});
		});
	});
});

describe('server-side api', () => {
	it('should receive messages and fire acknowledgements', function (done) {
		this.timeout(10000);

		e.apis.extension.listenFor('clientToServer', (data, cb) => {
			cb();
		});

		e.browser.client
			.switchTab(e.browser.tabs.dashboard)
			.executeAsync(done => window.dashboardApi.sendMessage('clientToServer', null, done))
			.call(done);
	});

	it('should send messages', function (done) {
		this.timeout(10000);

		let sendMessage;
		e.browser.client
			.switchTab(e.browser.tabs.dashboard)
			.execute(() => {
				window.serverToClientReceived = false;
				window.dashboardApi.listenFor('serverToClient', () => {
					window.serverToClientReceived = true;
				});
			})
			.then(() => {
				sendMessage = setInterval(() => {
					e.apis.extension.sendMessage('serverToClient');
				}, 500);
			})
			.switchTab(e.browser.tabs.dashboard)
			.executeAsync(done => {
				const checkMessageReceived = setInterval(() => {
					if (window.serverToClientReceived) {
						clearInterval(checkMessageReceived);
						done();
					}
				}, 50);
			})
			.then(() => {
				clearInterval(sendMessage);
				done();
			});
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
});
