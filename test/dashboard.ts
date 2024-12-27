// Packages
import test from "ava";
import type * as puppeteer from "puppeteer";

// Ours
import * as server from "./helpers/server";
import * as browser from "./helpers/browser";
server.setup();
const { initDashboard, initStandalone } = browser.setup();

import * as C from "./helpers/test-constants";

let dashboard: puppeteer.Page;
let standalone: puppeteer.Page;
test.before(async () => {
	dashboard = await initDashboard();
	standalone = await initStandalone();
});

test.serial("panels - should show up on the dashboard", async (t) => {
	setTimeout(t.fail, 1000);
	await dashboard.waitForFunction(() => {
		const found = document
			.querySelector("ncg-dashboard")!
			.shadowRoot!.querySelector("ncg-workspace")!
			.shadowRoot!.querySelector(
				'ncg-dashboard-panel[bundle="test-bundle"][panel="test"]',
			);
		return Boolean(found);
	});
	t.pass();
});

test.serial("panels - should show up standalone", async (t) => {
	setTimeout(t.fail, 1000);
	await standalone.waitForSelector("#test-bundle-paragraph");
	t.pass();
});

test("panels - get default styles injected", async (t) => {
	const response = await fetch(C.testPanelUrl());
	t.is(response.status, 200);
	t.true((await response.text()).includes("panel-defaults.css"));
});

test.serial(
	"ncg-dialog - should have the buttons defined in dialogButtons",
	async (t) => {
		const res = await dashboard.evaluate(() => {
			const dialog: any = window.dashboardApi.getDialog("test-dialog")!;
			console.log(dialog);
			dialog.open();

			function gatherButtonStats(buttonEl: HTMLButtonElement) {
				return {
					confirm: buttonEl.hasAttribute("dialog-confirm"),
					dismiss: buttonEl.hasAttribute("dialog-dismiss"),
					text: buttonEl.textContent!.trim(),
				};
			}

			return Array.from(
				dialog.querySelector(".buttons")!.querySelectorAll("paper-button"),
			).map(gatherButtonStats as any);
		});

		t.deepEqual(res, [
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
	},
);

test.serial(
	"ncg-dialog - should open when an element with a valid nodecg-dialog attribute is clicked",
	async (t) => {
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

		t.pass();
	},
);

test.serial.skip(
	"ncg-dialog - should emit dialog-confirmed when a confirm button is clicked",
	async (t) => {
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

		t.pass();
	},
);

test.serial.skip(
	"ncg-dialog - should emit dialog-dismissed when a dismiss button is clicked",
	async (t) => {
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

		t.pass();
	},
);

test.serial("retrieval - 404", async (t) => {
	const response = await fetch(
		`${C.rootUrl()}bundles/test-bundle/dashboard/bad.png`,
	);
	t.is(response.status, 404);
});

test.serial("retrieval - wrong bundle is 404", async (t) => {
	const response = await fetch(
		`${C.rootUrl()}bundles/fake-bundle/dashboard/panel.html`,
	);
	t.is(response.status, 404);
});
