import fs from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

import type * as puppeteer from "puppeteer";
import { expect } from "vitest";

import { setupTest } from "../helpers/setup";
import * as C from "../helpers/test-constants";
import * as util from "../helpers/utilities";

const test = await setupTest();

const UPLOAD_SOURCE_PATH = path.resolve(
	__dirname,
	"../fixtures/assets-to-upload/#twitter_banner.png",
);
const TWITTER_BANNER_PATH = path.join(
	C.assetsRoot(),
	"test-bundle/assets/#twitter_banner.png",
);

// Doing twice to assert file 'change' event
for (let i = 0; i < 2; i++) {
	test(`uploading #${i}`, async ({ apis, dashboard }) => {
		const assetRep = apis.extension.Replicant("assets:assets");

		// Make sure the file to upload does not exist first
		if (i === 0) {
			expect(fs.existsSync(TWITTER_BANNER_PATH)).toBe(false);
		}

		const assetTab = await util.shadowSelector(
			dashboard,
			"ncg-dashboard",
			'paper-tab[data-route="assets"]',
		);
		await assetTab.click();
		const assetCategoryEl = await util.shadowSelector(
			dashboard,
			"ncg-dashboard",
			"ncg-assets",
			'ncg-asset-category[collection-name="test-bundle"][category-name="assets"]',
		);
		const addEl: puppeteer.ElementHandle = (await dashboard.evaluateHandle(
			(el: any) => el.$.add,
			assetCategoryEl,
		)) as any;
		await addEl.click();
		const fileInputEl = await dashboard.evaluateHandle(
			(el: any) => el.$.uploader.$.fileInput,
			assetCategoryEl,
		);
		await new Promise((resolve) => {
			assetRep.on("change", resolve);
			(fileInputEl as any).uploadFile(UPLOAD_SOURCE_PATH);
		});

		await dashboard.evaluate(
			async (assetCategoryEl: any) =>
				new Promise<void>((resolve) => {
					if (assetCategoryEl._successfulUploads === 1) {
						resolve();
					} else {
						assetCategoryEl.$.uploader.addEventListener(
							"upload-success",
							resolve,
							{
								once: true,
								passive: true,
							},
						);
					}
				}),
			assetCategoryEl,
		);

		expect(fs.existsSync(TWITTER_BANNER_PATH)).toBe(true);
	});
}

test("retrieval - 200", async () => {
	const response = await fetch(
		`${C.rootUrl()}assets/test-bundle/assets/%23twitter_banner.png`,
	);
	expect(response.status).toBe(200);
	expect((await response.arrayBuffer()).byteLength).toBe(
		fs.readFileSync(TWITTER_BANNER_PATH).length,
	);
});

test("retrieval - 404", async () => {
	const response = await fetch(
		`${C.rootUrl()}assets/test-bundle/assets/bad.png`,
	);
	expect(response.status).toBe(404);
});

test("deletion - 200", async ({ dashboard }) => {
	const assetTab = await util.shadowSelector(
		dashboard,
		"ncg-dashboard",
		'paper-tab[data-route="assets"]',
	);
	await assetTab.click();

	const assetFileEl = await util.shadowSelector(
		dashboard,
		"ncg-dashboard",
		"ncg-assets",
		'ncg-asset-category[collection-name="test-bundle"][category-name="assets"]',
		"util-scrollable > ncg-asset-file",
	);
	const deleteButton: puppeteer.ElementHandle = (await dashboard.evaluateHandle(
		(el: any) => el.$.delete,
		assetFileEl,
	)) as any;

	await deleteButton.click();
	await setTimeout(500);
	expect(fs.existsSync(TWITTER_BANNER_PATH)).toBe(false);
});

test("deletion - 410", async ({}) => {
	const response = await fetch(
		`${C.rootUrl()}assets/test-bundle/assets/bad.png`,
		{ method: "delete" },
	);
	expect(response.status).toBe(410);
});
