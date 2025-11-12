import { expect } from "vitest";

import { setupTest } from "../helpers/setup";
import * as C from "../helpers/test-constants";

const test = await setupTest();

test("panels - should show up on the dashboard", async ({ dashboard }) => {
	await dashboard.waitForFunction(() => {
		const found = document
			.querySelector("ncg-dashboard")!
			.shadowRoot!.querySelector("ncg-workspace")!
			.shadowRoot!.querySelector(
				'ncg-dashboard-panel[bundle="test-bundle"][panel="test"]',
			);
		return Boolean(found);
	});
});

test("panels - should show up standalone", async ({ standalone }) => {
	await standalone.waitForSelector("#test-bundle-paragraph");
});

test("panels - get default styles injected", async () => {
	const response = await fetch(C.testPanelUrl());
	expect(response.status).toBe(200);
	expect(await response.text()).toMatch("panel-defaults.css");
});

test("ncg-dialog - should have the buttons defined in dialogButtons", async ({
	dashboard,
}) => {
	const res = await dashboard.evaluate(() => {
		const dialog: any = window.dashboardApi.getDialog("test-dialog")!;
		dialog.open();

		function gatherButtonStats(buttonEl: HTMLButtonElement) {
			return {
				confirm: buttonEl.hasAttribute("dialog-confirm"),
				dismiss: buttonEl.hasAttribute("dialog-dismiss"),
				text: buttonEl.textContent.trim(),
			};
		}

		return Array.from(
			dialog.querySelector(".buttons")!.querySelectorAll("paper-button"),
		).map(gatherButtonStats as any);
	});

	expect(res).toEqual([
		{
			confirm: false,
			dismiss: true,
			text: "close",
		},
		{
			confirm: true,
			dismiss: false,
			text: "accept",
		},
	]);
});

test("ncg-dialog - should open when an element with a valid nodecg-dialog attribute is clicked", async ({
	dashboard,
}) => {
	await dashboard.bringToFront();
	await dashboard.evaluate(
		async () =>
			new Promise<void>((resolve, reject) => {
				try {
					const openDialogButton = document
						.querySelector("ncg-dashboard")!
						.shadowRoot!.querySelector("ncg-workspace")!
						.shadowRoot!.querySelector(
							'ncg-dashboard-panel[bundle="test-bundle"][panel="test"]',
						)!
						.querySelector("iframe")!
						.contentWindow!.document.querySelector("#openDialog")!;

					const dialog = window.dashboardApi.getDialog("test-dialog")!;

					const originalOpen = dialog.open;
					const stubOpen = (): void => {
						resolve();
					};

					dialog.open = stubOpen;
					(openDialogButton as HTMLElement).click();
					dialog.open = originalOpen;
				} catch (error) {
					reject(error);
				}
			}),
	);
});

test(
	"ncg-dialog - should emit dialog-confirmed when a confirm button is clicked",
	{ skip: true },
	async ({ dashboard }) => {
		await dashboard.evaluate(
			async () =>
				new Promise<void>((resolve) => {
					const dialog: any = window.dashboardApi.getDialog("test-dialog");
					const dialogDocument: any =
						window.dashboardApi.getDialogDocument("test-dialog");
					const confirmButton: any = dialog.querySelector(
						"paper-button[dialog-confirm]",
					);
					dialogDocument.addEventListener(
						"dialog-confirmed",
						() => {
							resolve();
						},
						{ once: true, passive: true },
					);
					confirmButton.click();
				}),
		);
	},
);

test(
	"ncg-dialog - should emit dialog-dismissed when a dismiss button is clicked",
	{ skip: true },
	async ({ dashboard }) => {
		await dashboard.evaluate(
			async () =>
				new Promise<void>((resolve) => {
					// Open dialog first
					const openDialogButton = document
						.querySelector("ncg-dashboard")!
						.shadowRoot!.querySelector("ncg-workspace")!
						.shadowRoot!.querySelector(
							'ncg-dashboard-panel[bundle="test-bundle"][panel="test"]',
						)!
						.querySelector("iframe")!
						.contentWindow!.document.querySelector("#openDialog")!;
					(openDialogButton as HTMLElement).click();

					const dialog: any = window.dashboardApi.getDialog("test-dialog");
					const dialogDocument: any =
						window.dashboardApi.getDialogDocument("test-dialog");
					const dismissButton: any = dialog.querySelector(
						"paper-button[dialog-dismiss]",
					);
					dialogDocument.addEventListener(
						"dialog-dismissed",
						() => {
							resolve();
						},
						{ once: true, passive: true },
					);
					dismissButton.click();
				}),
		);
	},
);

test("retrieval - 404", async () => {
	const response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/dashboard/bad.png`,
	);
	expect(response.status).toBe(404);
});

test("retrieval - wrong bundle is 404", async () => {
	const response = await fetch(
		`${C.rootUrl()}bundles/fake-bundle/dashboard/panel.html`,
	);
	expect(response.status).toBe(404);
});

test("node_modules - should serve scoped package files", async () => {
	const response = await fetch(
		`${C.rootUrl()}node_modules/@babel/core/lib/index.js`,
	);
	expect(response.status).toBe(200);
	expect(response.headers.get("content-type")).toMatch(/javascript/);
});

test("node_modules - should serve deeply nested files", async () => {
	const response = await fetch(
		`${C.rootUrl()}node_modules/@babel/core/lib/config/index.js`,
	);
	expect(response.status).toBe(200);
	expect(response.headers.get("content-type")).toMatch(/javascript/);
});

test("node_modules - should return 404 for non-existent files", async () => {
	const response = await fetch(
		`${C.rootUrl()}node_modules/@babel/core/does-not-exist.js`,
	);
	expect(response.status).toBe(404);
});
