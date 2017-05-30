/* eslint-env node, mocha, browser */
'use strict';

const chai = require('chai');
const assert = chai.assert;
const e = require('./setup/test-environment');

describe('dashboard', function () {
	this.timeout(10000);

	describe('panels', () => {
		it('should show up on the dashboard', async () => {
			await e.browser.client.switchTab(e.browser.tabs.dashboard);
			const res = await e.browser.client.shadowDomElement([
				'ncg-dashboard',
				'ncg-workspace',
				'ncg-dashboard-panel[bundle="test-bundle"][panel="test"]'
			]);
			assert.isTrue(Boolean(res.value));
		});

		it('should show up standalone', async () => {
			await e.browser.client.switchTab(e.browser.tabs.panelStandalone);
			const isExisting = await e.browser.client.isExisting('#test-bundle-paragraph');
			assert.isTrue(isExisting);
		});
	});

	describe('shared sources', () => {
		it('should serve files', async () => {
			await e.browser.client.switchTab(e.browser.tabs.panelStandalone);
			const res = await e.browser.client.execute(() => {
				return window.SharedUtility;
			});
			assert.isAbove(Object.keys(res.value).length, 0);
		});
	});
});
