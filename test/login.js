'use strict';

// Packages
import * as test from 'ava';
const socketIoClient = require('socket.io-client');
const pRetry = require('p-retry');

// Ours
import * as server from './helpers/server';
import * as browser from './helpers/browser';
server.setup('nodecg-login.json');
const {initLogin, initDashboard, initGraphic} = browser.setup();

import * as C from './helpers/test-constants';

let loginPage;
test.before(async () => {
	loginPage = await initLogin();
});

test.serial('redirects unauthorized users to /login', async t => {
	await loginPage.goto(C.dashboardUrl());
	t.is(loginPage.url(), C.loginUrl());
});

test.serial('login should deny access to bad credentials', async t => {
	await Promise.all([
		loginPage.type('#username', 'admin'),
		loginPage.type('#password', 'wrong_password')
	]);
	await loginPage.click('#localSubmit');
	t.is(loginPage.url(), C.loginUrl());
});

test.serial('logging in and out should work', async t => {
	await logIn();
	await loginPage.waitForFunction(url => location.href === url, {}, C.dashboardUrl());
	await logOut(t);
	await loginPage.reload();
	t.is(loginPage.url(), C.loginUrl());
});

test.serial('regenerating a token should send the user back to /login', async t => {
	// This operation sometimes fails on CI
	const run = async () => {
		await logIn();

		const page = await initDashboard();
		// We need to preserve the coverage from this test, because it will be lost
		// when the page is redirected to /login.
		const coverage = await page.evaluate(() => {
			const ncgSettings = document.querySelector('ncg-dashboard').shadowRoot
				.querySelector('ncg-settings');
			ncgSettings.resetKey();
			return window.__coverage__;
		});

		await page.waitForFunction(loginUrl => location.href === loginUrl, {}, C.loginUrl());

		// Put our preserved coverage back on the page for later extraction.
		await page.evaluate(injectedCoverage => {
			window.__coverage__ = injectedCoverage;
		}, coverage);

		t.pass();
	};

	return pRetry(run, {retries: 10});
});

test.serial('token invalidation should show an UnauthorizedError on open pages', async t => {
	await logIn();
	const page = await initGraphic();
	await page.evaluate(() => {
		window.socket.emit('regenerateToken', window.token);
	});
	await page.waitForFunction(
		validUrl => location.href.startsWith(validUrl),
		{}, `${C.rootUrl()}authError?code=token_invalidated`
	);
	t.pass();
});

test.cb('socket should deny access to bad credentials', t => {
	t.plan(1);

	const socket = socketIoClient(`${C.rootUrl()}?key=bad_credentials`);
	socket.on('connect', () => {
		t.fail();
	});
	socket.on('event', () => {
		t.fail();
	});
	socket.on('error', error => {
		t.deepEqual(error, {
			message: 'No authorization token was found',
			code: 'credentials_required',
			type: 'UnauthorizedError'
		});
		t.end();
	});
});

async function logIn() {
	await loginPage.bringToFront();
	await loginPage.goto(C.loginUrl());
	if (loginPage.url() !== C.loginUrl()) {
		return loginPage;
	}

	await loginPage.type('#username', 'admin');
	await loginPage.type('#password', 'password');
	await loginPage.click('#localSubmit');
}

async function logOut(t) {
	const page = await t.context.browser.newPage();
	await page.goto(`${C.rootUrl()}logout`);
	await loginPage.bringToFront();
}
