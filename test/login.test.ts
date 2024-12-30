import { Page } from "puppeteer";
import socketIoClient from "socket.io-client";
import { expect } from "vitest";

import { setupTest } from "./helpers/setup";
import * as C from "./helpers/test-constants";

const test = await setupTest("nodecg-login.json");

test("redirects unauthorized users to /login", async ({ loginPage }) => {
	await loginPage.goto(C.dashboardUrl());
	expect(loginPage.url()).toBe(C.loginUrl());
});

test("login should deny access to bad credentials", async ({ loginPage }) => {
	await loginPage.type("#username", "admin");
	await loginPage.type("#password", "wrong_password");
	await Promise.all([
		loginPage.waitForNavigation(),
		loginPage.click("#localSubmit"),
	]);
	expect(loginPage.url()).toBe(C.loginUrl());
});

test("logging in and out should work", async ({ loginPage }) => {
	await logIn(loginPage);
	await logOut(loginPage);
});

test("should support logging in with a hashed password", async ({
	loginPage,
}) => {
	await logIn(loginPage, "other_admin");
	expect(loginPage.url()).toBe(C.dashboardUrl());
	await logOut(loginPage);
});

test("socket should deny access to bad credentials", async () => {
	const socket = socketIoClient(`${C.rootUrl()}?token=bad_credentials`);

	await new Promise<void>((resolve, reject) => {
		socket.once("connect", () => {
			reject("Socket was able to connect.");
		});
		socket.once("event", () => {
			reject("Socket received data.");
		});
		socket.once("connect_error", (error) => {
			expect(error.message).toBe("no credentials found");
			resolve();
		});
	});

	socket.removeAllListeners();
	socket.close();
});

async function logIn(
	loginPage: Page,
	username = "admin",
	password = "password",
): Promise<void | Page> {
	await loginPage.bringToFront();
	await loginPage.goto(C.dashboardUrl()); // Should redirect to the login page, but set our returnTo to the dashboard, which we want.
	expect(loginPage.url()).toBe(C.loginUrl());

	await loginPage.waitForNetworkIdle();

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

	await loginPage.click("#localSubmit");
	await loginPage.waitForNetworkIdle();

	expect(loginPage.url()).toBe(C.dashboardUrl());
}

async function logOut(loginPage: Page): Promise<void> {
	const page = await loginPage.browser().newPage();
	await page.goto(`${C.rootUrl()}logout`);
	await page.close();
	await loginPage.bringToFront();
	await loginPage.goto(C.loginUrl());
	expect(loginPage.url()).toBe(C.loginUrl());
}
