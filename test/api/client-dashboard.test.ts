import { expect } from "vitest";

import { setupTest } from "../helpers/setup";

const test = await setupTest();

test("should produce an error if a callback isn't given", ({ apis }) => {
	expect(() => {
		apis.extension.listenFor(
			"testMessageName",
			// @ts-expect-error
			"test",
		);
	}).toThrowErrorMatchingInlineSnapshot(
		`[Error: argument "handler" must be a function, but you provided a(n) undefined]`,
	);
});

// Check for basic connectivity. The rest of the tests are run from the dashboard as well.
test("should receive messages", async ({ dashboard, apis }) => {
	await dashboard.evaluate(() => {
		(window as any).serverToDashboardReceived = false;
		window.dashboardApi.listenFor("serverToDashboard", () => {
			(window as any).serverToDashboardReceived = true;
		});
	});

	const sendMessageInterval = setInterval(() => {
		apis.extension.sendMessage("serverToDashboard");
	}, 500);

	await dashboard.waitForFunction(
		() => (window as any).serverToDashboardReceived,
	);

	clearInterval(sendMessageInterval);
});

test("should send messages", async ({ dashboard, apis }) => {
	const promise = new Promise<void>((resolve) => {
		apis.extension.listenFor("dashboardToServer", () => {
			resolve();
		});
	});
	void dashboard.evaluate(() => {
		void window.dashboardApi.sendMessage("dashboardToServer");
	});
	return promise;
});

test("should support multiple listenFor handlers", async ({
	dashboard,
	apis,
}) => {
	await dashboard.evaluate(() => {
		let callbacksInvoked = 0;
		window.dashboardApi.listenFor("serverToDashboardMultiple", () => {
			checkDone();
		});

		window.dashboardApi.listenFor("serverToDashboardMultiple", () => {
			checkDone();
		});

		function checkDone(): void {
			callbacksInvoked++;
			(window as any).__serverToDashboardMultipleDone__ =
				callbacksInvoked === 2;
		}
	});

	// Send the message from the server to the clients.
	apis.extension.sendMessage("serverToDashboardMultiple");

	// Verify that our handlers both ran.
	await dashboard.waitForFunction(
		() => (window as any).__serverToDashboardMultipleDone__,
	);
});

test("#bundleVersion", async ({ dashboard }) => {
	const res = await dashboard.evaluate(() => window.dashboardApi.bundleVersion);
	expect(res).toBe("0.0.1");
});

test("#bundleGit", async ({ dashboard }) => {
	const res = await dashboard.evaluate(() => window.dashboardApi.bundleGit);
	expect(res).toMatchInlineSnapshot(`
		{
		  "branch": "master",
		  "date": "2018-07-13T17:09:29.000Z",
		  "hash": "6262681c7f35eccd7293d57a50bdd25e4cd90684",
		  "message": "Initial commit",
		  "shortHash": "6262681",
		}
	`);
});
