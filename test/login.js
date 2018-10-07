'use strict';

// Packages
import * as test from 'ava';
const socketIoClient = require('socket.io-client');

// Ours
import * as server from './helpers/server';
import * as browser from './helpers/browser';
server.setup('nodecg-login.json');
const {initLogin} = browser.setup();

import * as C from './helpers/test-constants';

test.beforeEach(async t => {
	t.context.loginPage = await initLogin();
});

test.serial('redirects unauthorized users to /login', async t => {
	const page = t.context.loginPage;
	await page.goto(C.dashboardUrl());
	const url = page.url();
	t.is(url, C.loginUrl());
});

test.serial('login should deny access to bad credentials', async t => {
	const page = t.context.loginPage;
	await page.type('#username', 'admin');
	await page.type('#password', 'wrong_password');
	await page.click('#localSubmit');

	const url = page.url();
	t.is(url, C.loginUrl());
});

test.serial('logging in and out should work', async t => {
	const page = await logIn(t);
	t.is(page.url(), C.dashboardUrl());
	await logOut(t);
	await page.reload();
	t.is(page.url(), C.loginUrl());
});

test.serial('regenerating a token should send the user back to /login', async t => {
	await logIn(t);
	const page = t.context.loginPage;

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
});

test.serial('token invalidation should show an UnauthorizedError on open pages', async t => {
	await logIn(t);

	const page = t.context.loginPage;
	await page.goto(C.graphicUrl());
	t.is(page.url(), C.graphicUrl());
	await page.evaluate(() => {
		window.socket.emit('regenerateToken', window.token);
	});
	await page.waitForFunction(
		validUrl => location.href.startsWith(validUrl),
		{},
		`${C.rootUrl()}authError?code=token_invalidated`
	);
	t.pass();
});

test.serial.cb('socket should deny access to bad credentials', t => {
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

async function logIn(t) {
	const page = t.context.loginPage;
	await page.goto(C.loginUrl());
	if (page.url() !== C.loginUrl()) {
		return page;
	}

	await page.type('#username', 'admin');
	await page.type('#password', 'password');
	await page.click('#localSubmit');
	await page.waitForNavigation();
	return page;
}

async function logOut(t) {
	const page = await t.context.browser.newPage();
	await page.goto(`${C.rootUrl()}logout`);
}
