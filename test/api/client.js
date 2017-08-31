'use strict';

// Packages
const test = require('ava');

// Ours
require('../helpers/nodecg-and-webdriver')(test, ['dashboard']); // Must be first.
const e = require('../helpers/test-environment');

test.serial('#config - should exist and have length', async t => {
	const res = await e.browser.client.execute(() => {
		return window.dashboardApi.config;
	});
	t.true(Object.keys(res.value).length > 0);
});

test.serial('#config - shouldn\'t reveal sensitive information', async t => {
	const res = await e.browser.client.execute(() => {
		return window.dashboardApi.config;
	});
	t.false(res.value.login.hasOwnProperty('sessionSecret')); // eslint-disable-line no-prototype-builtins
});

test.serial('#config - shouldn\'t be writable', async t => {
	const res = await e.browser.client.execute(() => {
		return Object.isFrozen(window.dashboardApi.config);
	});
	t.true(res.value);
});

test.serial('#bundleConfig - should exist and have length', async t => {
	const res = await e.browser.client.execute(() => {
		return window.dashboardApi.bundleConfig;
	});
	t.true(Object.keys(res.value).length > 0);
});

test.serial('#Logger - should exist and be the Logger constructor', async t => {
	const res = await e.browser.client.execute(() => {
		return window.dashboardApi.Logger && typeof window.dashboardApi.Logger === 'function';
	});
	t.true(res.value);
});

test.serial('#getDialog', async t => {
	const res = await e.browser.client.execute(() => {
		const dialog = window.dashboardApi.getDialog('test-dialog');
		return dialog && dialog.tagName === 'NCG-DIALOG';
	});
	t.true(res.value);
});

test.serial('#getDialogDocument', async t => {
	const res = await e.browser.client.execute(() => {
		const document = window.dashboardApi.getDialogDocument('test-dialog');
		return document && document.body && document.body.tagName === 'BODY';
	});
	t.true(res.value);
});

test.serial('#unlisten', async t => {
	const res = await e.browser.client.execute(() => {
		const handlerFunc = function () {};
		window.dashboardApi.listenFor('unlisten', handlerFunc);
		return window.dashboardApi.unlisten('unlisten', handlerFunc);
	});
	t.true(res.value);
});
