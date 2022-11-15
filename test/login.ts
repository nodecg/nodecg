// Packages
import type { TestFn, ExecutionContext } from 'ava';
import anyTest from 'ava';
import socketIoClient from 'socket.io-client';

// Ours
import * as server from './helpers/server';
import * as browser from './helpers/browser';
import type { Page } from 'puppeteer';

const test = anyTest as TestFn<browser.BrowserContext & server.ServerContext>;
server.setup('nodecg-login.json');
const { initLogin, initDashboard, initGraphic } = browser.setup();

import * as C from './helpers/test-constants';

let loginPage: Page;
test.before(async () => {
	loginPage = await initLogin();
});

test.afterEach(async (t) => {
	await logOut(t);
});

test.serial('redirects unauthorized users to /login', async (t) => {
	await loginPage.goto(C.dashboardUrl());
	t.is(loginPage.url(), C.loginUrl());
});

test.serial('login should deny access to bad credentials', async (t) => {
	await loginPage.type('#username', 'admin');
	await loginPage.type('#password', 'wrong_password');
	await loginPage.click('#localSubmit');
	t.is(loginPage.url(), C.loginUrl());
});

test.serial('logging in and out should work', async (t) => {
	await logIn();
	await logOut(t);
	await loginPage.reload();
	return t.is(loginPage.url(), C.loginUrl());
});

test.serial('should support logging in with a hashed password', async (t) => {
	await logIn('other_admin', 'password');
	return t.is(loginPage.url(), C.dashboardUrl());
});

test.serial('regenerating a token should send the user back to /login', async (t) => {
	await logIn();
	const page = await initDashboard();

	let coverage = {};
	try {
		const result = await Promise.all([
			page.waitForNavigation(),

			page.evaluate(() => {
				const ncgSettings: any = (document as any)
					.querySelector('ncg-dashboard')
					.shadowRoot.querySelector('ncg-settings');
				ncgSettings.resetKey();

				// We need to preserve the coverage from this test, because it will be lost
				// when the page is redirected to /login.
				return window.__coverage__;
			}),
		]);
		coverage = result[1];
	} catch (_) {
		return t.fail('Test failed, current URL is: ' + page.url());
	}

	// Put our preserved coverage back on the page for later extraction.
	await page.evaluate((injectedCoverage) => {
		window.__coverage__ = injectedCoverage;
	}, coverage);

	const expectedUrl = C.loginUrl();
	return t.true(page.url().startsWith(expectedUrl));
});

test.serial('token invalidation should show an UnauthorizedError on open pages', async (t) => {
	await logIn();
	const dash = await initDashboard();
	const graphic = await initGraphic();

	try {
		await Promise.all([
			graphic.waitForNavigation(),
			dash.evaluate(() => {
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				window.socket.emit('regenerateToken', undefined, () => {});
			}),
		]);
	} catch (_) {
		return t.fail('Test failed, current URL is: ' + graphic.url());
	}

	const expectedUrl = `${C.rootUrl()}authError?code=token_invalidated`;
	return t.true(graphic.url().startsWith(expectedUrl));
});

test.serial('socket should deny access to bad credentials', async (t) => {
	t.plan(1);

	const socket = socketIoClient(`${C.rootUrl()}?key=bad_credentials`);
	socket.once('connect', () => {
		t.fail('Socket was able to connect.');
	});
	socket.once('event', () => {
		t.fail('Socket received data.');
	});

	await new Promise<void>((resolve) => {
		socket.once('connect_error', (error: unknown) => {
			t.is((error as any).message, 'no credentials found');
			resolve();
		});
	});
});

async function logIn(username = 'admin', password = 'password'): Promise<void | Page> {
	await loginPage.bringToFront();
	await loginPage.goto(C.loginUrl());
	if (loginPage.url() !== C.loginUrl()) {
		return loginPage;
	}

	await loginPage.type('#username', username);
	await loginPage.type('#password', password);

	const navWait = loginPage.waitForNavigation();
	await loginPage.click('#localSubmit');
	await navWait;
}

async function logOut(t: ExecutionContext<browser.BrowserContext>): Promise<void> {
	const page = await t.context.browser.newPage();
	await page.goto(`${C.rootUrl()}logout`);
	await loginPage.bringToFront();
}
