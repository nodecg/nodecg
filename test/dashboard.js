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
				.isExisting('ncg-dashboard-panel[bundle="test-bundle"][panel="test"]')
				.then(isExisting => {
					assert.isTrue(isExisting);
					done();
				});
		});

		it('should show up standalone', done => {
			e.browser.client
				.switchTab(e.browser.tabs.panelStandalone)
				.isExisting('#test-bundle-paragraph')
				.then(isExisting => {
					assert.isTrue(isExisting);
					done();
				});
		});
	});
});
