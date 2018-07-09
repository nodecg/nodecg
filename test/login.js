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

test.beforeEach(async () => {
	await e.browser.client.switchTab(e.browser.tabs.login);
});

test.serial('redirects unauthorized users to /login', async t => {
	await e.browser.client.newWindow(C.DASHBOARD_URL);
	const url = await e.browser.client.getUrl();
	t.is(url, C.LOGIN_URL);
});

test.serial('should deny access to bad credentials', async t => {
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
	await logIn(t);
	const url = await e.browser.client.getUrl();
	t.is(url, C.DASHBOARD_URL);
});

test.serial('logging out should work', async t => {
	t.is(await e.browser.client.getUrl(), C.DASHBOARD_URL);
	await logOut();
	await e.browser.client.refresh();
	t.is(await e.browser.client.getUrl(), C.LOGIN_URL);
});

test.serial('regenerating a token should send the user back to /login', async t => {
	await logIn(t);
	await e.browser.client.newWindow(C.DASHBOARD_URL);
	t.is(await e.browser.client.getUrl(), C.DASHBOARD_URL);

	// We need to preserve the coverage from this test, because it will be lost
	// when the page is redirected to /login.
	const {value: coverage} = await e.browser.client.execute(() => {
		const ncgSettings = document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-settings');
		ncgSettings.resetKey();
		return window.__coverage__;
	});

	await e.browser.client.waitUntil(async () => {
		const url = await e.browser.client.getUrl();
		return url === C.LOGIN_URL;
	}, 5000);

	// Put our preserved coverage back on the page for later extraction.
	await e.browser.client.execute(injectedCoverage => {
		window.__coverage__ = injectedCoverage;
	}, coverage);

	t.pass();
});

test.serial('token invalidation should show an UnauthorizedError on open pages', async t => {
	await e.browser.client.newWindow(C.DASHBOARD_URL);
	await logIn(t);
	t.is(await e.browser.client.getUrl(), C.DASHBOARD_URL);

	await e.browser.client.newWindow(C.GRAPHIC_URL);
	t.is(await e.browser.client.getUrl(), C.GRAPHIC_URL);
	await e.browser.client.execute(() => {
		window.socket.emit('regenerateToken', window.token);
	});

	await new Promise(resolve => {
		setTimeout(() => {
			resolve();
		}, 1000);
	});

	const url = await e.browser.client.getUrl();
	t.true(url.startsWith(`${C.ROOT_URL}authError?code=token_invalidated`));
});

async function logIn(t) {
	t.is(await e.browser.client.getUrl(), C.LOGIN_URL);

	await e.browser.client.waitForVisible('#username');
	await e.browser.client.waitForVisible('#localForm');
	await e.browser.client.waitForVisible('#password');

	await e.browser.client.setValue('#username', 'admin');
	await e.browser.client.setValue('#password', 'password');
	await e.browser.client.click('#localSubmit');
}

async function logOut() {
	const currentTabId = await e.browser.client.getCurrentTabId();
	await e.browser.client.newWindow(`${C.ROOT_URL}logout`);
	await e.browser.client.close();
	await e.browser.client.switchTab(currentTabId);
}
