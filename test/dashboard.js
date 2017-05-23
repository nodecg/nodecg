/* eslint-env node, mocha, browser */
'use strict';

const chai = require('chai');
const assert = chai.assert;
const e = require('./setup/test-environment');

describe('dashboard', function () {
	this.timeout(10000);

	describe('panels', () => {
		it('should show up on the dashboard', done => {
			e.browser.client
				.switchTab(e.browser.tabs.dashboard)
				.shadowDomElement([
					'ncg-dashboard',
					'ncg-workspace',
					'ncg-dashboard-panel[bundle="test-bundle"][panel="test"]'
				])
				.then(ret => {
					assert.isObject(ret.value);
					assert.isFunction(ret.value.someFunc);
					done();
				})
				.catch(done);
		});

		it('should show up standalone', done => {
			e.browser.client
				.switchTab(e.browser.tabs.panelStandalone)
				.isExisting('#test-bundle-paragraph')
				.then(isExisting => {
					assert.isTrue(isExisting);
					done();
				})
				.catch(done);
		});
	});

	describe('shared sources', () => {
		it('should serve files', done => {
			e.browser.client
				.switchTab(e.browser.tabs.panelStandalone)
				.execute(() => {
					return window.SharedUtility;
				})
				.then(ret => {
					assert.isAbove(Object.keys(ret.value).length, 0);
					done();
				});
		});
	});
});
