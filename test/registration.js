'use strict';

// Native
import * as fs from 'fs';
import * as path from 'path';

// Packages
import test from 'ava';
import * as axios from 'axios';
const simpleGit = require('simple-git/promise');
const replace = require('replace-in-file');

// Ours
import * as server from './helpers/server';
import * as browser from './helpers/browser';
server.setup();
browser.setup();
import * as C from './helpers/test-constants';
import * as util from './helpers/utilities';

let dashboard;
let singleInstance;
test.before(async () => {
	singleInstance = await browser.initSingleInstance();
	dashboard = await browser.initDashboard();
	const graphicButton = await dashboard.evaluateHandle(() =>
		document.querySelector('ncg-dashboard').shadowRoot.querySelector('paper-tab[data-route="graphics"]'));
	await graphicButton.click();
	const collapseButton = await dashboard.evaluateHandle(() =>
		document.querySelector('ncg-dashboard')
			.shadowRoot.querySelector('ncg-graphics')
			.shadowRoot.querySelector('ncg-graphics-bundle')
			.shadowRoot.querySelector('ncg-graphic')
			.shadowRoot.querySelector('#collapseButton'));
	await collapseButton.click();
});

test('singleInstance - scripts get injected into /instance/*.html routes', async t => {
	const response = await axios.get(`${C.rootUrl()}instance/killed.html`);
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
	const page = await browser.initSingleInstance();
	await page.waitForFunction(() => location.href === `${C.rootUrl()}instance/busy.html?pathname=/bundles/test-bundle/graphics/single_instance.html`)
});

test.serial('singleInstance - should redirect to killed.html when the instance is killed', async t => {
	const button = await dashboard.evaluateHandle(() =>
		document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-graphics').shadowRoot
			.querySelector('ncg-graphics-bundle').shadowRoot
			.querySelectorAll('ncg-graphic')[1].shadowRoot
			.querySelector('ncg-graphic-instance').$.killButton);
	await button.click();
	await dashboard.waitForFunction(() => location.href === `${C.rootUrl()}instance/killed.html?pathname=/bundles/test-bundle/graphics/single_instance.html`)
});

test.serial('singleInstance - should allow the graphic to be taken after being killed', async t => {
	const page = await browser.initSingleInstance();
	t.is(page.url(), C.singleInstanceUrl());
});

test.serial('refresh all instances in a bundle', async t => {
	const graphic = await browser.initGraphic();
	await util.waitForRegistration(graphic);

	await dashboard.evaluate(() => {
		const graphicsBundleEl = document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-graphics').shadowRoot
			.querySelector('ncg-graphics-bundle');
		graphicsBundleEl.$.reloadButton.click();
		graphicsBundleEl.shadowRoot.querySelector('paper-button[dialog-confirm]').click();
	});

	const refreshMarker = await util.waitForRegistration(graphic);
	t.is(refreshMarker, undefined);
});

test.serial('refresh all instances of a graphic', async t => {
	const graphic = await browser.initGraphic();
	await util.waitForRegistration(graphic);

	await dashboard.bringToFront();
	await dashboard.evaluate(() => {
		document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-graphics').shadowRoot
			.querySelector('ncg-graphics-bundle').shadowRoot
			.querySelector('ncg-graphic')[0].shadowRoot
			.querySelector('ncg-graphic-instance:last-of-type').$.reloadButton.click();
	});

	const refreshMarker = await util.waitForRegistration(graphic);
	t.is(refreshMarker, undefined);
});

test.serial('refresh individual instance', async t => {
	const graphic = await browser.initGraphic();
	await util.waitForRegistration(graphic);

	await dashboard.evaluate(() => {
		document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-graphics').shadowRoot
			.querySelector('ncg-graphics-bundle').shadowRoot
			.querySelectorAll('ncg-graphic')[0].shadowRoot
			.querySelector('ncg-graphic-instance:last-of-type').$.reloadButton.click();
	});

	const refreshMarker = await util.waitForRegistration(graphic);
	t.is(refreshMarker, undefined);
});

const statusText = () => document.querySelector('ncg-dashboard')
	.shadowRoot.querySelector('ncg-graphics')
	.shadowRoot.querySelector('ncg-graphics-bundle')
	.shadowRoot.querySelector('ncg-graphic')
	.shadowRoot.querySelector('ncg-graphic-instance:last-of-type')
	.$.status.textContent;

test.serial('version out of date', async t => {
	replace.sync({
		files: path.resolve(process.env.NODECG_ROOT, 'bundles/test-bundle/package.json'),
		from: '"version": "0.0.1"',
		to: '"version": "0.0.2"'
	});
	await util.sleep(1500);

	let text = await dashboard.evaluate(statusText);
	t.is(text, 'Potentially Out of Date');

	replace.sync({
		files: path.resolve(process.env.NODECG_ROOT, 'bundles/test-bundle/package.json'),
		from: '"version": "0.0.2"',
		to: '"version": "0.0.1"'
	});
	await util.sleep(1500);

	text = await dashboard.evaluate(statusText);
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

	const text = await dashboard.evaluate(statusText);
	t.is(text, 'Potentially Out of Date');
});

test.serial('shows a diff when hovering over "potentially out of date" status', async t => {
	await dashboard.bringToFront();
	const graphicInstance = await dashboard.waitForFunction(() =>
		document.querySelector('ncg-dashboard')
			.shadowRoot.querySelector('ncg-graphics')
			.shadowRoot.querySelector('ncg-graphics-bundle')
			.shadowRoot.querySelector('ncg-graphic')
			.shadowRoot.querySelector('ncg-graphic-instance[status="out-of-date"]'));

	await graphicInstance.hover('#status');
	await dashboard.waitForFunction(el => getComputedStyle(el).display !== 'none', {}, graphicInstance);
	const diffText = await dashboard.evaluate(el => el.$.diff.$.body.textContent, graphicInstance);
	t.true(diffText.includes('Current:'));
	t.true(diffText.includes('Latest:'));
	t.true(/0\.0\.1 - \w{7} \[Initial commit\]/.test(diffText));
	t.true(/0\.0\.1 - \w{7} \[new commit\]/.test(diffText));
});
