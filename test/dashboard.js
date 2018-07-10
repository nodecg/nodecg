'use strict';

// Packages
const test = require('ava');

// Ours
require('./helpers/nodecg-and-webdriver')(test, {tabs: ['dashboard', 'standalone']}); // Must be first.
const e = require('./helpers/test-environment');

test.beforeEach(async () => {
	await e.browser.client.switchTab(e.browser.tabs.dashboard);
});

test.serial('panels - should show up on the dashboard', async t => {
	const res = await e.browser.client.shadowDomElement([
		'ncg-dashboard',
		'ncg-workspace',
		'ncg-dashboard-panel[bundle="test-bundle"][panel="test"]'
	]);
	t.true(Boolean(res.value));
});

test.serial('panels - should show up standalone', async t => {
	await e.browser.client.switchTab(e.browser.tabs.panelStandalone);
	const isExisting = await e.browser.client.isExisting('#test-bundle-paragraph');
	t.true(isExisting);
});

test.serial('ncg-dialog - should have the buttons defined in dialogButtons', async t => {
	const res = await e.browser.client.execute(() => {
		const dialog = window.dashboardApi.getDialog('test-dialog');

		function gatherButtonStats(buttonEl) {
			return {
				confirm: buttonEl.hasAttribute('dialog-confirm'),
				dismiss: buttonEl.hasAttribute('dialog-dismiss'),
				text: buttonEl.textContent.trim()
			};
		}

		return Array.from(dialog.querySelector('.buttons').querySelectorAll('paper-button'))
			.map(gatherButtonStats);
	});

	t.deepEqual(res.value, [{
		confirm: false,
		dismiss: true,
		text: 'close'
	}, {
		confirm: true,
		dismiss: false,
		text: 'accept'
	}]);
});

test.serial('ncg-dialog - should open when an element with a valid nodecg-dialog attribute is clicked', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const openDialogButton = document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-workspace').shadowRoot
			.querySelector('ncg-dashboard-panel[bundle="test-bundle"][panel="test"]')
			.querySelector('iframe').contentWindow.document
			.querySelector('#openDialog');

		const dialog = window.dashboardApi.getDialog('test-dialog');
		const beforeClickDisplay = window.getComputedStyle(dialog).display;

		dialog.addEventListener('neon-animation-finish', () => {
			const afterClickDisplay = window.getComputedStyle(dialog).display;
			const opened = dialog.opened;
			dialog.close(); // Clean up for the next test.
			done({
				beforeClickDisplay,
				afterClickDisplay,
				opened
			});
		}, {once: true, passive: true});

		openDialogButton.click();
	});

	t.deepEqual(res.value, {
		beforeClickDisplay: 'none',
		afterClickDisplay: 'flex',
		opened: true
	});
});

test.serial('ncg-dialog - should emit dialog-confirmed when a confirm button is clicked', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const dialog = window.dashboardApi.getDialog('test-dialog');
		const dialogDocument = window.dashboardApi.getDialogDocument('test-dialog');
		const confirmButton = dialog.querySelector('paper-button[dialog-confirm]');

		dialog.addEventListener('neon-animation-finish', () => {
			dialogDocument.addEventListener('dialog-confirmed', () => {
				done(true);
			}, {once: true, passive: true});
			confirmButton.click();
		}, {once: true, passive: true});

		dialog.open();
	});

	t.true(res.value);
});

test.serial('ncg-dialog - should emit dialog-dismissed when a dismiss button is clicked', async t => {
	const res = await e.browser.client.executeAsync(done => {
		const dialog = window.dashboardApi.getDialog('test-dialog');
		const dialogDocument = window.dashboardApi.getDialogDocument('test-dialog');
		const dismissButton = dialog.querySelector('paper-button[dialog-dismiss]');

		dialog.addEventListener('neon-animation-finish', () => {
			dialogDocument.addEventListener('dialog-dismissed', () => {
				done(true);
			}, {once: true, passive: true});
			dismissButton.click();
		}, {once: true, passive: true});

		dialog.open();
	});

	t.true(res.value);
});

test.serial('connection toasts', async t => {
	let ret = await e.browser.client.execute(() => {
		const dashboard = document.getElementById('dashboard');
		window.socket.emit('disconnect');
		return {
			toastText: dashboard.$.mainToast.text,
			toastOpened: dashboard.$.mainToast.opened,
			disconnected: dashboard.disconnected
		};
	});
	t.deepEqual(ret.value, {
		toastText: 'Lost connection to NodeCG server!',
		toastOpened: true,
		disconnected: true
	});

	ret = await e.browser.client.execute(() => {
		const dashboard = document.getElementById('dashboard');
		window.socket.emit('reconnecting', 3);
		return {
			reconnectToastOpened: dashboard.$.reconnectToast.opened
		};
	});
	t.deepEqual(ret.value, {
		reconnectToastOpened: true
	});

	ret = await e.browser.client.execute(() => {
		const dashboard = document.getElementById('dashboard');
		window.socket.emit('reconnect_failed');
		return {
			toastText: dashboard.$.mainToast.text,
			toastOpened: dashboard.$.mainToast.opened
		};
	});
	t.deepEqual(ret.value, {
		toastText: 'Failed to reconnect to NodeCG server!',
		toastOpened: true
	});

	ret = await e.browser.client.execute(() => {
		const dashboard = document.getElementById('dashboard');
		window.socket.emit('reconnect', 3);
		return {
			toastText: dashboard.$.mainToast.text,
			toastOpened: dashboard.$.mainToast.opened,
			reconnectToastOpened: dashboard.$.reconnectToast.opened,
			disconnected: dashboard.disconnected
		};
	});
	t.deepEqual(ret.value, {
		toastText: 'Reconnected to NodeCG server!',
		toastOpened: true,
		reconnectToastOpened: false,
		disconnected: false
	});
});
