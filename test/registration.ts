// Native
import fs from 'fs';
import path from 'path';

// Packages
import test from 'ava';
import axios from 'axios';
import simpleGit from 'simple-git/promise';
// @ts-ignore
import { replaceInFile } from 'replace-in-file';

// Ours
import * as server from './helpers/server';
import * as browser from './helpers/browser';

server.setup();
const { initSingleInstance, initDashboard, initGraphic } = browser.setup();

import * as C from './helpers/test-constants';
import * as util from './helpers/utilities';
import { Page } from 'puppeteer';

let singleInstance: Page;
let dashboard: Page;
test.before(async () => {
	singleInstance = await initSingleInstance();
	dashboard = await initDashboard();

	const graphicButton = await util.shadowSelector(dashboard, 'ncg-dashboard', 'paper-tab[data-route="graphics"]');
	await graphicButton.click();

	const collapseButton = await util.shadowSelector(
		dashboard,
		'ncg-dashboard',
		'ncg-graphics',
		'ncg-graphics-bundle',
		'ncg-graphic',
		'#collapseButton',
	);
	await collapseButton.click();
});

test('singleInstance - scripts get injected into /instance/*.html routes', async t => {
	const response = await axios.get(`${C.rootUrl()}instance/killed.html`);
	t.is(response.status, 200);
	t.true(response.data.includes('<script src="/nodecg-api.min.js">'));
	t.true(response.data.includes('<script src="/socket.io/socket.io.js"></script>'));
});

test.serial('singleInstance - should redirect to busy.html when the instance is already taken', async t => {
	t.plan(0);
	const page = await initSingleInstance();
	await page.waitForFunction(
		(rootUrl: string) =>
			location.href ===
			`${rootUrl}instance/busy.html?pathname=/bundles/test-bundle/graphics/single_instance.html`,
		{},
		C.rootUrl(),
	);
});

test.serial('singleInstance - should redirect to killed.html when the instance is killed', async t => {
	t.plan(0);

	const graphicBoard = await util.shadowSelector(
		dashboard,
		'ncg-dashboard',
		'ncg-graphics',
		'ncg-graphics-bundle',
		'ncg-graphic:nth-of-type(2)',
	);

	await dashboard.bringToFront();
	const expandButton: any = await dashboard.evaluateHandle(
		el => el.shadowRoot.querySelector('paper-button#collapseButton'),
		graphicBoard,
	);
	await expandButton.click();

	const button: any = await dashboard.evaluateHandle(
		el => el.shadowRoot.querySelector('ncg-graphic-instance').$.killButton,
		graphicBoard,
	);
	await button.click();

	await singleInstance.waitForFunction(
		(rootUrl: string) =>
			location.href ===
			`${rootUrl}instance/killed.html?pathname=/bundles/test-bundle/graphics/single_instance.html`,
		{},
		C.rootUrl(),
	);
});

test.serial('singleInstance - should allow the graphic to be taken after being killed', async t => {
	const page = await initSingleInstance();
	t.is(page.url(), C.singleInstanceUrl());
});

test.serial('refresh all instances in a bundle', async t => {
	const graphic = await initGraphic();
	await util.waitForRegistration(graphic);

	const graphicBundle = await util.shadowSelector(dashboard, 'ncg-dashboard', 'ncg-graphics', 'ncg-graphics-bundle');

	await dashboard.bringToFront();
	const reload: any = await dashboard.evaluateHandle(el => el.$.reloadButton, graphicBundle);
	await reload.click();
	const confirm: any = await dashboard.evaluateHandle(
		el => el.shadowRoot.querySelector('paper-button[dialog-confirm]'),
		graphicBundle,
	);
	await confirm.click();

	await graphic.waitFor(500);
	const refreshMarker = await util.waitForRegistration(graphic);
	t.is(refreshMarker, undefined);
});

test.serial('refresh all instances of a graphic', async t => {
	const graphic = await initGraphic();
	await util.waitForRegistration(graphic);

	await dashboard.bringToFront();
	const reload = await util.shadowSelector(
		dashboard,
		'ncg-dashboard',
		'ncg-graphics',
		'ncg-graphics-bundle',
		'ncg-graphic',
		'#reloadButton',
	);
	await reload.click();

	await graphic.waitFor(500);
	const refreshMarker = await util.waitForRegistration(graphic);
	t.is(refreshMarker, undefined);
});

test.serial('refresh individual instance', async t => {
	const graphic = await initGraphic();
	await util.waitForRegistration(graphic);

	await dashboard.bringToFront();
	const reload = await util.shadowSelector(
		dashboard,
		'ncg-dashboard',
		'ncg-graphics',
		'ncg-graphics-bundle',
		'ncg-graphic',
		'ncg-graphic-instance:last-of-type',
		'#reloadButton',
	);
	await reload.click();

	await graphic.waitFor(500);
	const refreshMarker = await util.waitForRegistration(graphic);
	t.is(refreshMarker, undefined);
});

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const statusEl = async (page: Page) =>
	util.shadowSelector(
		page,
		'ncg-dashboard',
		'ncg-graphics',
		'ncg-graphics-bundle',
		'ncg-graphic',
		'ncg-graphic-instance:last-of-type',
		'#status',
	);

test.serial('version out of date', async t => {
	replaceInFile.sync({
		files: path.resolve(process.env.NODECG_ROOT, 'bundles/test-bundle/package.json'),
		from: '"version": "0.0.1"',
		to: '"version": "0.0.2"',
	});
	await dashboard.waitFor(1500);

	let text = await dashboard.evaluate(el => el.textContent, await statusEl(dashboard));
	t.is(text, 'Potentially Out of Date');

	replaceInFile.sync({
		files: path.resolve(process.env.NODECG_ROOT, 'bundles/test-bundle/package.json'),
		from: '"version": "0.0.2"',
		to: '"version": "0.0.1"',
	});
	await dashboard.waitFor(1500);

	text = await dashboard.evaluate(el => el.textContent, await statusEl(dashboard));
	t.is(text, 'Latest');
});

test.serial('git out of date', async t => {
	fs.writeFileSync(path.resolve(process.env.NODECG_ROOT, 'bundles/test-bundle/new_file.txt'), 'foo');
	const git = simpleGit(path.resolve(process.env.NODECG_ROOT, 'bundles/test-bundle'));
	await git.add('./new_file.txt');
	await git.commit('new commit');
	await dashboard.waitFor(1500);

	const text = await dashboard.evaluate(el => el.textContent, await statusEl(dashboard));
	t.is(text, 'Potentially Out of Date');
});

test.serial('shows a diff when hovering over "potentially out of date" status', async t => {
	await dashboard.bringToFront();
	const graphicInstance = await util.shadowSelector(
		dashboard,
		'ncg-dashboard',
		'ncg-graphics',
		'ncg-graphics-bundle',
		'ncg-graphic',
		'ncg-graphic-instance[status="out-of-date"]',
	);

	await graphicInstance.hover();
	await dashboard.waitForFunction(el => getComputedStyle(el).display !== 'none', {}, graphicInstance);
	const diffText = await dashboard.evaluate(el => el.$.diff.$.body.textContent, graphicInstance);
	t.true(diffText.includes('Current:'));
	t.true(diffText.includes('Latest:'));
	t.regex(diffText, /0\.0\.1 - \w{7} \[Initial commit\]/);
	t.regex(diffText, /0\.0\.1 - \w{7} \[new commit\]/);

	const closeButton: any = await dashboard.evaluateHandle(
		el => el.$.diff.shadowRoot.querySelector('paper-icon-button'),
		graphicInstance,
	);
	await closeButton.click();
	await dashboard.waitForFunction(
		el => getComputedStyle(el.$.diff).opacity === '0',
		{ timeout: 100000 },
		graphicInstance,
	);
});

test.serial('dragging the graphic generates the correct url for obs', async t => {
	t.plan(1);

	const graphicLink = await util.shadowSelector(
		dashboard,
		'ncg-dashboard',
		'ncg-graphics',
		'ncg-graphics-bundle',
		'ncg-graphic',
		'#url',
	);

	await dashboard.evaluateHandle(gl => {
		gl.addEventListener('dragstart', (ev: DragEvent) => {
			ev.preventDefault();

			if (!ev.dataTransfer) return;
			const data = ev.dataTransfer.getData('text/uri-list');
			console.log(data);
		});
	}, graphicLink);

	const linkBoundingBox = await graphicLink.boundingBox();
	if (!linkBoundingBox) {
		t.fail();
		return;
	}

	await dashboard.bringToFront();

	// Move mouse to centre of link and start dragging
	await dashboard.mouse.move(
		linkBoundingBox.x + linkBoundingBox.width / 2,
		linkBoundingBox.y + linkBoundingBox.height / 2,
	);
	await dashboard.mouse.down();

	dashboard.on('console', msg => {
		// This allows other console messages to come through while the test is running, as long as the required message comes through eventually
		if (
			msg.text() ===
			`${C.rootUrl()}bundles/test-bundle/graphics/index.html?layer-name=index&layer-height=720&layer-width=1280`
		) {
			t.pass();
		}
	});

	// Move to top left of screen over 10 ticks
	// Dragstart event should be called during this
	await dashboard.mouse.move(0, 0, { steps: 10 });

	await dashboard.waitFor(200);
});
