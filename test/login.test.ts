import type { ExecutionContext, TestFn } from "ava";
import anyTest from "ava";
import type { Page } from "puppeteer";
import socketIoClient from "socket.io-client";

import * as browser from "./helpers/browser";
import * as server from "./helpers/server";

const test = anyTest as TestFn<browser.BrowserContext & server.ServerContext>;
server.setup("nodecg-login.json");
const { initLogin, initDashboard, initGraphic } = browser.setup();

import * as C from "./helpers/test-constants";

let loginPage: Page;
test.before(async () => {
	loginPage = await initLogin();
});

test.afterEach.always(async (t) => {
	await logOut(t);
});

test.serial("redirects unauthorized users to /login", async (t) => {
	await loginPage.goto(C.dashboardUrl());
	t.is(loginPage.url(), C.loginUrl());
});

test.serial("login should deny access to bad credentials", async (t) => {
	await loginPage.type("#username", "admin");
	await loginPage.type("#password", "wrong_password");
	await Promise.all([
		loginPage.waitForNavigation(),
		loginPage.click("#localSubmit"),
	]);
	t.is(loginPage.url(), C.loginUrl());
});

test.serial("logging in and out should work", async (t) => {
	await logIn(t);
	await logOut(t);
});

test.serial("should support logging in with a hashed password", async (t) => {
	await logIn(t, "other_admin");
	return t.is(loginPage.url(), C.dashboardUrl());
});

test.serial(
	"regenerating a token should send the user back to /login",
	async (t) => {
		await logIn(t);
		const page = await initDashboard();

		const [_, coverage] = await Promise.all([
			page.waitForNavigation(),

			page.evaluate(() => {
				const ncgSettings: any = (document as any)
					.querySelector("ncg-dashboard")
					.shadowRoot.querySelector("ncg-settings");
				ncgSettings.resetKey();

				// We need to preserve the coverage from this test, because it will be lost
				// when the page is redirected to /login.
				return window.__coverage__;
			}),
		]);

		// Put our preserved coverage back on the page for later extraction.
		await page.evaluate((injectedCoverage: any) => {
			window.__coverage__ = injectedCoverage;
		}, coverage);

		t.is(page.url(), C.loginUrl());
		await page.close();
	},
);

test.serial(
	"token invalidation should show an UnauthorizedError on open pages",
	async (t) => {
		await logIn(t);
		const dash = await initDashboard();
		const graphic = await initGraphic();

		await Promise.all([
			graphic.waitForNavigation(),
			dash.evaluate(() => {
				// In a timeout in an attempt to make this test less flaky.
				// The flakiness _might_ be because the token regen happens before the "waitForNavigation" has a chance to attach?
				// Who knows.
				setTimeout(() => {
					// eslint-disable-next-line @typescript-eslint/no-empty-function
					window.socket.emit("regenerateToken", () => {});
				}, 500);
			}),
		]);

		const expectedUrl = `${C.rootUrl()}authError?code=token_invalidated`;
		return t.true(graphic.url().startsWith(expectedUrl));
	},
);

test.serial("socket should deny access to bad credentials", async (t) => {
	t.plan(1);

	const socket = socketIoClient(`${C.rootUrl()}?token=bad_credentials`);
	socket.once("connect", () => {
		t.fail("Socket was able to connect.");
	});
	socket.once("event", () => {
		t.fail("Socket received data.");
	});

	await new Promise<void>((resolve) => {
		socket.once("connect_error", (error: unknown) => {
			t.is((error as any).message, "no credentials found");
			resolve();
		});
	});

	socket.removeAllListeners();
	socket.close();
});

async function logIn(
	t: ExecutionContext<browser.BrowserContext>,
	username = "admin",
	password = "password",
): Promise<void | Page> {
	await loginPage.bringToFront();
	await loginPage.goto(C.dashboardUrl()); // Should redirect to the login page, but set our returnTo to the dashboard, which we want.
	t.is(loginPage.url(), C.loginUrl());

	// Use this instead of .type to ensure that any previous input is cleared.
	await loginPage.evaluate(
		(un, pw) => {
			const usernameInput = document.getElementById(
				"username",
			) as HTMLInputElement;
			const passwordInput = document.getElementById(
				"password",
			) as HTMLInputElement;
			usernameInput.value = un;
			passwordInput.value = pw;
		},
		username,
		password,
	);

	await Promise.all([
		new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				clearInterval(interval);
				reject(
					new Error(
						`Timed out while waiting for login page to redirect to dashboard page after successful login. Current URL is: "${loginPage.url()}"`,
					),
				);
			}, 30000);
			const interval = setInterval(() => {
				if (loginPage.url() === C.dashboardUrl()) {
					clearTimeout(timeout);
					clearInterval(interval);
					resolve();
				}
			}, 1000);
		}),
		loginPage.click("#localSubmit"),
	]);
	t.is(loginPage.url(), C.dashboardUrl());
}

async function logOut(
	t: ExecutionContext<browser.BrowserContext>,
): Promise<void> {
	const page = await t.context.browser.newPage();
	await page.goto(`${C.rootUrl()}logout`);
	await page.close();
	await loginPage.bringToFront();
	await loginPage.goto(C.loginUrl());
	t.is(loginPage.url(), C.loginUrl());
}
