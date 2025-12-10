import { expect } from "vitest";

import { setupTest } from "../../helpers/setup";

const test = await setupTest();

test("#config - should exist and have length", async ({ dashboard }) => {
	const res = await dashboard.evaluate(() => window.dashboardApi.config);
	expect(Object.keys(res).length > 0).toBe(true);
});

test("#config - shouldn't reveal sensitive information", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(() => window.dashboardApi.config);
	// eslint-disable-next-line no-prototype-builtins
	expect(res.login.hasOwnProperty("sessionSecret")).toBe(false);
});

test("#config - shouldn't be writable", async ({ dashboard }) => {
	const res = await dashboard.evaluate(() =>
		Object.isFrozen(window.dashboardApi.config),
	);
	expect(res).toBe(true);
});

test("#bundleConfig - should exist and have length", async ({ dashboard }) => {
	const res = await dashboard.evaluate(() => window.dashboardApi.bundleConfig);
	expect(Object.keys(res).length > 0).toBe(true);
});

test("#Logger - should exist and be the Logger constructor", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(
		() =>
			window.dashboardApi.Logger &&
			typeof window.dashboardApi.Logger === "function",
	);
	expect(res).toBe(true);
});

test("#getDialog", async ({ dashboard }) => {
	const res = await dashboard.evaluate(() => {
		const dialog = window.dashboardApi.getDialog("test-dialog");
		return dialog && dialog.tagName === "NCG-DIALOG";
	});
	expect(res).toBe(true);
});

test("#getDialogDocument", async ({ dashboard }) => {
	const res = await dashboard.evaluate(() => {
		const document = window.dashboardApi.getDialogDocument("test-dialog");
		return document?.body?.tagName === "BODY";
	});
	expect(res).toBe(true);
});

test("#unlisten", async ({ dashboard }) => {
	const res = await dashboard.evaluate(() => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const handlerFunc = function (): void {};
		window.dashboardApi.listenFor("unlisten", handlerFunc);
		return window.dashboardApi.unlisten("unlisten", handlerFunc);
	});
	expect(res).toBe(true);
});
