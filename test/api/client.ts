// Packages
import test from "ava";
import type * as puppeteer from "puppeteer";

// Ours
import * as server from "../helpers/server";
import * as browser from "../helpers/browser";

server.setup();
const { initDashboard } = browser.setup();

let dashboard: puppeteer.Page;
test.before(async () => {
	dashboard = await initDashboard();
});

test.serial("#config - should exist and have length", async (t) => {
	const res = await dashboard.evaluate(() => window.dashboardApi.config);
	t.true(Object.keys(res).length > 0);
});

test.serial("#config - shouldn't reveal sensitive information", async (t) => {
	const res = await dashboard.evaluate(() => window.dashboardApi.config);
	t.false(res.login.hasOwnProperty("sessionSecret")); // eslint-disable-line no-prototype-builtins
});

test.serial("#config - shouldn't be writable", async (t) => {
	const res = await dashboard.evaluate(() =>
		Object.isFrozen(window.dashboardApi.config),
	);
	t.true(res);
});

test.serial("#bundleConfig - should exist and have length", async (t) => {
	const res = await dashboard.evaluate(() => window.dashboardApi.bundleConfig);
	t.true(Object.keys(res).length > 0);
});

test.serial(
	"#Logger - should exist and be the Logger constructor",
	async (t) => {
		const res = await dashboard.evaluate(
			() =>
				window.dashboardApi.Logger &&
				typeof window.dashboardApi.Logger === "function",
		);
		t.true(res);
	},
);

test.serial("#getDialog", async (t) => {
	const res = await dashboard.evaluate(() => {
		const dialog = window.dashboardApi.getDialog("test-dialog");
		return dialog && dialog.tagName === "NCG-DIALOG";
	});
	t.true(res);
});

test.serial("#getDialogDocument", async (t) => {
	const res = await dashboard.evaluate(() => {
		const document = window.dashboardApi.getDialogDocument("test-dialog");
		return document?.body && document.body.tagName === "BODY";
	});
	t.true(res);
});

test.serial("#unlisten", async (t) => {
	const res = await dashboard.evaluate(() => {
		// eslint-disable-next-line @typescript-eslint/no-empty-function
		const handlerFunc = function (): void {};
		window.dashboardApi.listenFor("unlisten", handlerFunc);
		return window.dashboardApi.unlisten("unlisten", handlerFunc);
	});
	t.true(res);
});
