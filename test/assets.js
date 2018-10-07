'use strict';

// Native
import * as fs from 'fs';
import * as path from 'path';

// Packages
import test from 'ava';
import * as axios from 'axios';

// Ours
import * as server from './helpers/server';
import * as browser from './helpers/browser';

server.setup();
browser.setup();

import * as C from './helpers/test-constants';
import * as util from './helpers/utilities';

let dashboard;
test.before(async () => {
	dashboard = await browser.initDashboard();
});

const TWITTER_BANNER_PATH = path.join(C.ASSETS_ROOT, 'test-bundle/assets/twitter_banner.png');

test.serial('uploading', async t => {
	const assetTab = await dashboard.evaluateHandle(() => document.querySelector('ncg-dashboard').shadowRoot.querySelector('paper-tab[data-route="assets"]'));
	await assetTab.click();
	const assetCategoryEl = await dashboard.evaluateHandle(() => {
		return document
			.querySelector('ncg-dashboard')
			.shadowRoot
			.querySelector('ncg-assets')
			.shadowRoot
			.querySelector('ncg-asset-category[collection-name="test-bundle"][category-name="assets"]');
	});
	const addEl = await dashboard.evaluateHandle(el => el.$.add, assetCategoryEl);
	await addEl.click();
	const fileInputEl = await dashboard.evaluateHandle(el => el.$.uploader.$.fileInput, assetCategoryEl);
	fileInputEl.uploadFile(path.resolve(__dirname, 'fixtures/assets-to-upload/twitter_banner.png'));

	await dashboard.evaluate(assetCategoryEl => new Promise(resolve => {
		if (assetCategoryEl._successfulUploads === 1) {
			resolve();
		} else {
			assetCategoryEl.$.uploader.addEventListener('upload-success', resolve, {once: true, passive: true});
		}
	}), assetCategoryEl);

	t.true(fs.existsSync(TWITTER_BANNER_PATH));
});

test.serial('retrieval - 200', async t => {
	const response = await axios.get(`${C.rootUrl()}assets/test-bundle/assets/twitter_banner.png`, {
		responseType: 'arraybuffer'
	});
	t.is(response.status, 200);
	t.deepEqual(response.data.length, fs.readFileSync(TWITTER_BANNER_PATH).length);
});

test.serial('retrieval - 404', async t => {
	try {
		await axios.get(`${C.rootUrl()}assets/test-bundle/assets/bad.png`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});

test.serial('deletion - 200', async t => {
	const deleteButton = await dashboard.waitForFunction(() => {
		const file = document.querySelector('ncg-dashboard')
			.shadowRoot.querySelector('ncg-assets')
			.shadowRoot.querySelector('ncg-asset-category[collection-name="test-bundle"][category-name="assets"]')
			.shadowRoot.querySelector('util-scrollable > ncg-asset-file')
		return file && file.$.delete;
	});

	await deleteButton.click();

	await util.sleep(500);

	t.false(fs.existsSync(TWITTER_BANNER_PATH));
});

test.serial('deletion - 410', async t => {
	try {
		await axios.delete(`${C.rootUrl()}assets/test-bundle/assets/bad.png`);
	} catch (error) {
		t.is(error.response.status, 410);
	}
});
