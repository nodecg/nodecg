'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Packages
const axios = require('axios');
const simpleGit = require('simple-git/promise');
const replace = require('replace-in-file');
const test = require('ava');

// Ours
require('./helpers/nodecg-and-webdriver')(test, {tabs: ['dashboard', 'single-instance']}); // Must be first.
const C = require('./helpers/test-constants');
const e = require('./helpers/test-environment');
const util = require('./helpers/utilities');

test.before(async () => {
	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	await e.browser.client.click('ncg-dashboard paper-tab[data-route="graphics"]');
	await e.browser.client.click('ncg-dashboard ncg-graphics ncg-graphics-bundle ncg-graphic #collapseButton');
});

test.beforeEach(async () => {
	await e.browser.client.switchTab(e.browser.tabs.singleInstance);
});

test('singleInstance - scripts get injected into /instance/*.html routes', async t => {
	const response = await axios.get(`${C.ROOT_URL}instance/killed.html`);
	t.is(response.status, 200);
	t.true(response.data.includes('<script src="/nodecg-api.min.js">'));
	t.true(response.data.includes('<script src="/socket.io/socket.io.js"></script>'));
});

test.serial.cb('singleInstance - shouldn\'t enter an infinite redirect loop when including a polymer element that loads an external stylesheet', t => {
	const registration = require('../lib/graphics/registration');

	function cb(url) {
		if (url === '/bundles/test-bundle/graphics/single_instance.html') {
			throw new Error('The graphic must have gotten redirected.');
		}
	}

	process.nextTick(() => {
		registration.once('graphicAvailable', cb);
	});

	setTimeout(() => {
		registration.removeListener('graphicAvailable', cb);
		t.end();
	}, 5000);
});

test.serial('singleInstance - should redirect to busy.html when the instance is already taken', async t => {
	await e.browser.client.newWindow(C.SINGLE_INSTANCE_URL);
	await util.sleep(1000);
	t.is(
		await e.browser.client.getUrl(),
		`${C.ROOT_URL}instance/busy.html?pathname=/bundles/test-bundle/graphics/single_instance.html`
	);
});

test.serial('singleInstance - should redirect to killed.html when the instance is killed', async t => {
	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	await e.browser.client.execute(() => {
		document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-graphics').shadowRoot
			.querySelector('ncg-graphics-bundle').shadowRoot
			.querySelectorAll('ncg-graphic')[1].shadowRoot
			.querySelector('ncg-graphic-instance').$.killButton.click();
	});

	await e.browser.client.switchTab(e.browser.tabs.singleInstance);
	t.is(
		await e.browser.client.getUrl(),
		`${C.ROOT_URL}instance/killed.html?pathname=/bundles/test-bundle/graphics/single_instance.html`
	);
});

test.serial('singleInstance - should allow the graphic to be taken after being killed', async t => {
	await e.browser.client.newWindow(C.SINGLE_INSTANCE_URL);
	await util.sleep(500);
	t.is(await e.browser.client.getUrl(), C.SINGLE_INSTANCE_URL);
});

test.serial('refresh all instances in a bundle', async t => {
	await e.browser.client.newWindow(C.GRAPHIC_URL);
	const graphicTabId = await e.browser.client.getCurrentTabId();
	await util.waitForRegistration();

	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	await util.sleep(50);
	await e.browser.client.execute(() => {
		const graphicsBundleEl = document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-graphics').shadowRoot
			.querySelector('ncg-graphics-bundle');
		graphicsBundleEl.$.reloadButton.click();
		graphicsBundleEl.shadowRoot.querySelector('paper-button[dialog-confirm]').click();
	});

	await e.browser.client.switchTab(graphicTabId);
	await util.sleep(500);
	const refreshMarker = await util.waitForRegistration();
	t.is(refreshMarker, null);
});

test.serial('refresh all instances of a graphic', async t => {
	await e.browser.client.newWindow(C.GRAPHIC_URL);
	const graphicTabId = await e.browser.client.getCurrentTabId();
	await util.waitForRegistration();

	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	await util.sleep(50);
	await e.browser.client.click('ncg-dashboard ncg-graphics ncg-graphics-bundle' +
		' ncg-graphic #reloadButton');

	await e.browser.client.switchTab(graphicTabId);
	await util.sleep(500);
	const refreshMarker = await util.waitForRegistration();
	await e.browser.client.close(); // We don't need the coverage data from this tab.
	t.is(refreshMarker, null);
});

test.serial('refresh individual instance', async t => {
	await e.browser.client.newWindow(C.GRAPHIC_URL);
	const graphicTabId = await e.browser.client.getCurrentTabId();
	await util.waitForRegistration();

	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	await util.sleep(50);
	await e.browser.client.execute(() => {
		document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-graphics').shadowRoot
			.querySelector('ncg-graphics-bundle').shadowRoot
			.querySelectorAll('ncg-graphic')[0].shadowRoot
			.querySelector('ncg-graphic-instance:last-of-type').$.reloadButton.click();
	});

	await e.browser.client.switchTab(graphicTabId);
	await util.sleep(1000);
	const refreshMarker = await util.waitForRegistration();
	await e.browser.client.close(); // We don't need the coverage data from this tab.
	t.is(refreshMarker, null);
});

test.serial('version out of date', async t => {
	replace.sync({
		files: path.resolve(process.env.NODECG_ROOT, 'bundles/test-bundle/package.json'),
		from: '"version": "0.0.1"',
		to: '"version": "0.0.2"'
	});
	await util.sleep(1500);

	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	let text = await e.browser.client.getText('ncg-dashboard ncg-graphics ncg-graphics-bundle ' +
		'ncg-graphic ncg-graphic-instance:last-of-type #status');
	t.is(text, 'Potentially Out of Date');

	replace.sync({
		files: path.resolve(process.env.NODECG_ROOT, 'bundles/test-bundle/package.json'),
		from: '"version": "0.0.2"',
		to: '"version": "0.0.1"'
	});
	await util.sleep(1500);

	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	text = await e.browser.client.getText('ncg-dashboard ncg-graphics ncg-graphics-bundle ' +
		'ncg-graphic ncg-graphic-instance:last-of-type #status');
	t.is(text, 'Latest');
});

test.serial('git out of date', async t => {
	fs.writeFileSync(
		path.resolve(process.env.NODECG_ROOT, 'bundles/test-bundle/new_file.txt'),
		'foo'
	);
	const git = simpleGit(path.resolve(process.env.NODECG_ROOT, 'bundles/test-bundle'));
	await git.add('./new_file.txt');
	await git.commit('new commit');
	await util.sleep(1500);

	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	const text = await e.browser.client.getText('ncg-dashboard ncg-graphics ncg-graphics-bundle ' +
		'ncg-graphic ncg-graphic-instance:last-of-type #status');
	t.is(text, 'Potentially Out of Date');
});

test.serial('shows a diff when hovering over "potentially out of date" status', async t => {
	await e.browser.client.switchTab(e.browser.tabs.dashboard);
	await e.browser.client.moveToObject('ncg-dashboard ncg-graphics ncg-graphics-bundle ' +
		'ncg-graphic ncg-graphic-instance[status="out-of-date"] #status');

	const diffSelector = 'ncg-dashboard ncg-graphics ncg-graphics-bundle ' +
		'ncg-graphic ncg-graphic-instance[status="out-of-date"] #diff';
	await e.browser.client.isVisible(diffSelector);
	const diffText = await e.browser.client.getText(diffSelector);

	t.true(/Current: 0\.0\.1 - 6262681 \[Initial commit]\nLatest: {2}0\.0\.1 - .{7} \[new commit]/.test(diffText));
});
