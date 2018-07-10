'use strict';

// Native
const fs = require('fs');
const path = require('path');

// Packages
const test = require('ava');
const axios = require('axios');

// Ours
require('./helpers/nodecg-and-webdriver')(test, {tabs: ['dashboard']}); // Must be first.
const C = require('./helpers/test-constants');
const e = require('./helpers/test-environment');

const TWITTER_BANNER_PATH = path.join(C.ASSETS_ROOT, 'test-bundle/assets/twitter_banner.png');

test.serial('uploading', async t => {
	await e.browser.client.switchTab(e.browser.tabs.dashboard);

	await e.browser.client.execute(() => {
		const assetCategoryEl = document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-assets').shadowRoot
			.querySelector('ncg-asset-category[collection-name="test-bundle"][category-name="assets"]');
		console.log('assetCategoryEl:', assetCategoryEl);
		window._assetCategoryEl = assetCategoryEl;

		assetCategoryEl.$.add.click();

		// WebdriverIO can't pierce shadow roots.
		// So, to use the .chooseFile() method, we have to move our
		// input outside of any shadow roots.
		const fileInput = assetCategoryEl.$.uploader.$.fileInput;
		document.body.appendChild(fileInput);
	});

	await e.browser.client.chooseFile(
		'#fileInput',
		path.resolve(__dirname, 'fixtures/assets-to-upload/twitter_banner.png')
	);

	await e.browser.client.executeAsync(done => {
		const assetCategoryEl = window._assetCategoryEl;
		if (assetCategoryEl._successfulUploads === 1) {
			done();
		} else {
			assetCategoryEl.$.uploader.addEventListener('upload-success', () => {
				done();
			}, {once: true, passive: true});
		}
	});

	t.true(fs.existsSync(TWITTER_BANNER_PATH));
});

test.serial('retrieval - 200', async t => {
	const response = await axios.get(`${C.ROOT_URL}assets/test-bundle/assets/twitter_banner.png`, {
		responseType: 'arraybuffer'
	});
	t.is(response.status, 200);
	t.deepEqual(response.data.length, fs.readFileSync(TWITTER_BANNER_PATH).length);
});

test.serial('retrieval - 404', async t => {
	try {
		await axios.get(`${C.ROOT_URL}assets/test-bundle/assets/bad.png`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});

test.serial('deletion', async t => {
	await e.browser.client.switchTab(e.browser.tabs.dashboard);

	await e.browser.client.execute(() => {
		const assetCategoryFiles = document.querySelector('ncg-dashboard').shadowRoot
			.querySelector('ncg-assets').shadowRoot
			.querySelector('ncg-asset-category[collection-name="test-bundle"][category-name="assets"]').shadowRoot
			.querySelector('util-scrollable > ncg-asset-file');
		console.log('assetCategoryFiles:', assetCategoryFiles);
		window._assetCategoryFiles = assetCategoryFiles;

		assetCategoryFiles.$.delete.click();
	});

	t.false(fs.existsSync(TWITTER_BANNER_PATH));
});

test.serial('deletion - 410', async t => {
	try {
		await axios.delete(`${C.ROOT_URL}assets/test-bundle/assets/bad.png`);
	} catch (error) {
		t.is(error.response.status, 410);
	}
});

