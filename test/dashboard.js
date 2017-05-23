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
					assert.isTrue(Boolean(ret.value));
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
});
