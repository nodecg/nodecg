'use strict';

// Packages
const test = require('ava');

// Ours
require('./helpers/nodecg-and-webdriver')(test, {tabs: ['dashboard', 'standalone']}); // Must be first.
const e = require('./helpers/test-environment');

test.serial('panels - should show up on the dashboard', async t => {
	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	const res = await e.browser.client.shadowDomElement([
		'ncg-dashboard',
		'ncg-workspace',
		'ncg-dashboard-panel[bundle="test-bundle"][panel="test"]'
	]);
	t.true(Boolean(res.value));
});

test.serial('panels - should show up standalone', async t => {
	await e.browser.client.switchTab(e.browser.tabs.panelStandalone);
	const isExisting = await e.browser.client.isExisting('#test-bundle-paragraph');
	t.true(isExisting);
});

test.serial('shared sources - should serve files', async t => {
	await e.browser.client.switchTab(e.browser.tabs.panelStandalone);
	const res = await e.browser.client.execute(() => {
		return window.SharedUtility;
	});
	t.true(Object.keys(res.value).length > 0);
});
