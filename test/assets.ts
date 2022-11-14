// Native
import fs from 'fs';
import path from 'path';

// Packages
import type { TestFn } from 'ava';
import anyTest from 'ava';
import axios from 'axios';
import type puppeteer from 'puppeteer';

// Ours
import * as server from './helpers/server';
import * as browser from './helpers/browser';

const test = anyTest as TestFn<browser.BrowserContext & server.ServerContext>;
server.setup();
const { initDashboard } = browser.setup();

import * as C from './helpers/test-constants';
import * as util from './helpers/utilities';

let dashboard: puppeteer.Page;
test.before(async () => {
	dashboard = await initDashboard();
});

const UPLOAD_SOURCE_PATH = path.resolve(__dirname, 'fixtures/assets-to-upload/#twitter_banner.png');
const TWITTER_BANNER_PATH = path.join(C.assetsRoot(), 'test-bundle/assets/#twitter_banner.png');

// Doing twice to assert file 'change' event
for (let i = 0; i < 2; i++) {
	// eslint-disable-next-line @typescript-eslint/no-loop-func
	test.serial(`uploading #${i}`, async (t) => {
		const assetRep = t.context.apis.extension.Replicant('assets:assets');

		// Make sure the file to upload does not exist first
		if (i === 0) {
			t.false(fs.existsSync(TWITTER_BANNER_PATH));
		}

		const assetTab = await util.shadowSelector(dashboard, 'ncg-dashboard', 'paper-tab[data-route="assets"]');
		await assetTab.click();
		const assetCategoryEl = await util.shadowSelector(
			dashboard,
			'ncg-dashboard',
			'ncg-assets',
			'ncg-asset-category[collection-name="test-bundle"][category-name="assets"]',
		);
		const addEl: puppeteer.ElementHandle = (await dashboard.evaluateHandle(
			(el: any) => el.$.add,
			assetCategoryEl,
		)) as any;
		await addEl.click();
		const fileInputEl = await dashboard.evaluateHandle((el: any) => el.$.uploader.$.fileInput, assetCategoryEl);
		await new Promise((resolve) => {
			assetRep.on('change', resolve);
			(fileInputEl as any).uploadFile(UPLOAD_SOURCE_PATH);
		});

		await dashboard.evaluate(
			async (assetCategoryEl: any) =>
				new Promise<void>((resolve) => {
					if (assetCategoryEl._successfulUploads === 1) {
						resolve();
					} else {
						assetCategoryEl.$.uploader.addEventListener('upload-success', resolve, {
							once: true,
							passive: true,
						});
					}
				}),
			assetCategoryEl,
		);

		t.true(fs.existsSync(TWITTER_BANNER_PATH));
	});
}

test.serial('retrieval - 200', async (t) => {
	const response = await axios.get(`${C.rootUrl()}assets/test-bundle/assets/%23twitter_banner.png`, {
		responseType: 'arraybuffer',
	});
	t.is(response.status, 200);
	t.deepEqual(response.data.length, fs.readFileSync(TWITTER_BANNER_PATH).length);
});

test.serial('retrieval - 404', async (t) => {
	try {
		await axios.get(`${C.rootUrl()}assets/test-bundle/assets/bad.png`);
	} catch (error) {
		t.is(error.response.status, 404);
	}
});

test.serial('deletion - 200', async (t) => {
	const deleteButton: puppeteer.ElementHandle = (await dashboard.waitForFunction(() => {
		const file = document
			.querySelector('ncg-dashboard')!
			.shadowRoot!.querySelector('ncg-assets')!
			.shadowRoot!.querySelector('ncg-asset-category[collection-name="test-bundle"][category-name="assets"]')!
			.shadowRoot!.querySelector('util-scrollable > ncg-asset-file');
		return (file as any).$?.delete;
	})) as any;

	await deleteButton.click();
	await util.sleep(500);
	t.false(fs.existsSync(TWITTER_BANNER_PATH));
});

test.serial('deletion - 410', async (t) => {
	try {
		await axios.delete(`${C.rootUrl()}assets/test-bundle/assets/bad.png`);
	} catch (error) {
		t.is(error.response.status, 410);
	}
});
