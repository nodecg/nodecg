// Packages
import test from 'ava';
import axios from 'axios';
import puppeteer from 'puppeteer';

// Ours
import * as server from './helpers/server';
import * as browser from './helpers/browser';
server.setup();
const { initDashboard, initStandalone } = browser.setup();

import * as C from './helpers/test-constants';

let dashboard: puppeteer.Page;
let standalone: puppeteer.Page;
test.before(async () => {
	dashboard = await initDashboard();
	standalone = await initStandalone();
});

test.serial('panels - should show up on the dashboard', async t => {
	setTimeout(t.fail, 1000);
	await dashboard.waitForFunction(() => {
		const found = document
			.querySelector('ncg-dashboard')!
			.shadowRoot!.querySelector('ncg-workspace')!
			.shadowRoot!.querySelector('ncg-dashboard-panel[bundle="test-bundle"][panel="test"]');
		return Boolean(found);
	});
	t.pass();
});

test.serial('panels - should show up standalone', async t => {
	setTimeout(t.fail, 1000);
	await standalone.waitForSelector('#test-bundle-paragraph');
	t.pass();
});

test('panels - get default styles injected', async t => {
	const response = await axios.get(C.testPanelUrl());
	t.is(response.status, 200);
	t.true(response.data.includes('panel-defaults.css'));
});

test.serial('ncg-dialog - should have the buttons defined in dialogButtons', async t => {
	const res = await dashboard.evaluate(() => {
		const dialog: any = window.dashboardApi.getDialog('test-dialog')!;
		console.log(dialog);
		dialog.open();

		// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
		function gatherButtonStats(buttonEl: HTMLButtonElement) {
			return {
				confirm: buttonEl.hasAttribute('dialog-confirm'),
				dismiss: buttonEl.hasAttribute('dialog-dismiss'),
				text: buttonEl.textContent!.trim(),
			};
		}

		return Array.from(dialog.querySelector('.buttons')!.querySelectorAll('paper-button')).map(gatherButtonStats);
	});

	t.deepEqual(res, [
		{
			confirm: false,
			dismiss: true,
			text: 'close',
		},
		{
			confirm: true,
			dismiss: false,
			text: 'accept',
		},
	]);
});

test.serial('ncg-dialog - should open when an element with a valid nodecg-dialog attribute is clicked', async t => {
	await dashboard.bringToFront();
	await dashboard.evaluate(
		async () =>
			new Promise((resolve, reject) => {
				try {
					const openDialogButton = document!
						.querySelector('ncg-dashboard')!
						.shadowRoot!.querySelector('ncg-workspace')!
						.shadowRoot!.querySelector('ncg-dashboard-panel[bundle="test-bundle"][panel="test"]')!
						.querySelector('iframe')!
						.contentWindow!.document.querySelector('#openDialog')! as HTMLButtonElement;

					const dialog = window.dashboardApi.getDialog('test-dialog') as HTMLElement & {
						opened: boolean;
						close: () => void;
						open: () => void;
					};

					const originalOpen = dialog.open;
					const stubOpen = (): void => {
						resolve();
					};

					dialog.open = stubOpen;
					openDialogButton.click();
					dialog.open = originalOpen;
				} catch (error) {
					reject(error);
				}
			}),
	);

	t.pass();
});

test.serial('ncg-dialog - should emit dialog-confirmed when a confirm button is clicked', async t => {
	await dashboard.evaluate(
		async () =>
			new Promise(resolve => {
				const dialog = window.dashboardApi.getDialog('test-dialog') as HTMLElement & {
					opened: boolean;
					open: () => void;
				};
				const dialogDocument: any = window.dashboardApi.getDialogDocument('test-dialog');
				const confirmButton: any = dialog.querySelector('paper-button[dialog-confirm]');
				dialogDocument.addEventListener(
					'dialog-confirmed',
					() => {
						resolve();
					},
					{ once: true, passive: true },
				);
				confirmButton.click();
			}),
	);

	t.pass();
});

test.serial('ncg-dialog - should emit dialog-dismissed when a dismiss button is clicked', async t => {
	await dashboard.evaluate(
		async () =>
			new Promise(resolve => {
				const dialog: any = window.dashboardApi.getDialog('test-dialog');
				const dialogDocument: any = window.dashboardApi.getDialogDocument('test-dialog');
				const dismissButton: any = dialog.querySelector('paper-button[dialog-dismiss]');
				dialogDocument.addEventListener(
					'dialog-dismissed',
					() => {
						resolve();
					},
					{ once: true, passive: true },
				);
				dismissButton.click();
			}),
	);

	t.pass();
});

test.serial('connection toasts', async t => {
	let ret: any = await dashboard.evaluate(() => {
		const dashboard: any = document.getElementById('nodecg_dashboard');
		// TODO: use actual disconnection (setOfflineMode)
		(window as any).socket.emit('disconnect');
		return {
			toastText: dashboard.$.mainToast.text,
			toastOpened: dashboard.$.mainToast.opened,
			disconnected: dashboard.disconnected,
		};
	});
	t.deepEqual(ret, {
		toastText: 'Lost connection to NodeCG server!',
		toastOpened: true,
		disconnected: true,
	});

	ret = await dashboard.evaluate(() => {
		const dashboard: any = document.getElementById('nodecg_dashboard');
		(window as any).socket.emit('reconnecting', 3);
		return {
			reconnectToastOpened: dashboard.$.reconnectToast.opened,
		};
	});
	t.deepEqual(ret, {
		reconnectToastOpened: true,
	});

	ret = await dashboard.evaluate(() => {
		const dashboard: any = document.getElementById('nodecg_dashboard');
		(window as any).socket.emit('reconnect_failed');
		return {
			toastText: dashboard.$.mainToast.text,
			toastOpened: dashboard.$.mainToast.opened,
		};
	});
	t.deepEqual(ret, {
		toastText: 'Failed to reconnect to NodeCG server!',
		toastOpened: true,
	});

	ret = await dashboard.evaluate(() => {
		const dashboard: any = document.getElementById('nodecg_dashboard');
		(window as any).socket.emit('reconnect', 3);
		return {
			toastText: dashboard.$.mainToast.text,
			toastOpened: dashboard.$.mainToast.opened,
			reconnectToastOpened: dashboard.$.reconnectToast.opened,
			disconnected: dashboard.disconnected,
		};
	});
	t.deepEqual(ret, {
		toastText: 'Reconnected to NodeCG server!',
		toastOpened: true,
		reconnectToastOpened: false,
		disconnected: false,
	});
});

test.serial('retrieval - 404', async t => {
	try {
		await axios.get(`${C.rootUrl()}bundles/test-bundle/dashboard/bad.png`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});

test.serial('retrieval - wrong bundle is 404', async t => {
	try {
		await axios.get(`${C.rootUrl()}bundles/fake-bundle/dashboard/panel.html`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});
