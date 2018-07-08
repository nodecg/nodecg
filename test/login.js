'use strict';

// Packages
const test = require('ava');

// Ours
require('./helpers/nodecg-and-webdriver')(test, { // Must be first.
	tabs: ['login'],
	nodecgConfigName: 'nodecg-login.json'
});
const C = require('./helpers/test-constants');
const e = require('./helpers/test-environment');

test.serial('redirects unauthorized users to /login', async t => {
	await e.browser.client.newWindow(C.DASHBOARD_URL);
	const url = await e.browser.client.getUrl();
	t.is(url, C.LOGIN_URL);
});

test.serial('should deny access to bad credentials', async t => {
	await e.browser.client.switchTab(e.browser.tabs.login);

	await e.browser.client.waitForVisible('#username');
	await e.browser.client.waitForVisible('#localForm');
	await e.browser.client.waitForVisible('#password');

	await e.browser.client.setValue('#username', 'admin');
	await e.browser.client.setValue('#password', 'wrong_password');
	await e.browser.client.click('#localSubmit');

	const url = await e.browser.client.getUrl();
	t.is(url, C.LOGIN_URL);
});

test.serial('logging in should work', async t => {
	await e.browser.client.switchTab(e.browser.tabs.login);

	await e.browser.client.waitForVisible('#username');
	await e.browser.client.waitForVisible('#localForm');
	await e.browser.client.waitForVisible('#password');

	await e.browser.client.setValue('#username', 'admin');
	await e.browser.client.setValue('#password', 'password');
	await e.browser.client.click('#localSubmit');

	const url = await e.browser.client.getUrl();
	t.is(url, C.DASHBOARD_URL);
});

test.serial('logging out should work', async t => {
	await e.browser.client.newWindow(`${C.ROOT_URL}logout`);
	const url = await e.browser.client.getUrl();
	t.is(url, C.LOGIN_URL);
});
