import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

import fse from "fs-extra";
import isCi from "is-ci";
import * as puppeteer from "puppeteer";
import { afterAll, test } from "vitest";

import type { serverApiFactory } from "../../src/server/api.server";
import type { NodeCGServer } from "../../src/server/server";
import * as C from "./test-constants";
import { populateTestData } from "./populateTestData";

const tmpdir = os.tmpdir();

function createTmpDir() {
	const dir = path.join(tmpdir, randomUUID());
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

export async function setupTest(nodecgConfigName = "nodecg.json") {
	const tempFolder = createTmpDir();

	// Tell NodeCG to look in our new temp folder for bundles, cfg, db, and assets, rather than whatever ones the user
	// may have. We don't want to touch any existing user data!
	process.env.NODECG_ROOT = tempFolder;

	fse.copySync(
		"test/fixtures/nodecg-core/assets",
		path.join(tempFolder, "assets"),
	);
	fse.copySync(
		"test/fixtures/nodecg-core/bundles",
		path.join(tempFolder, "bundles"),
	);
	fse.moveSync(
		path.join(tempFolder, "bundles/test-bundle/git"),
		path.join(tempFolder, "bundles/test-bundle/.git"),
	);
	fse.copySync("test/fixtures/nodecg-core/cfg", path.join(tempFolder, "cfg"));
	fse.copySync(
		`test/fixtures/nodecg-core/cfg/${nodecgConfigName}`,
		path.join(tempFolder, "cfg/nodecg.json"),
	);
	fse.writeFileSync(
		path.join(tempFolder, "should-be-forbidden.txt"),
		"exploit succeeded",
		"utf-8",
	);

	const { NodeCGServer } = await import("../../src/server/server");
	const server = new NodeCGServer();

	await populateTestData();
	await server.start();

	afterAll(async () => {
		await server.stop();
		fse.removeSync(tempFolder);
	});

	return test
		.extend<{ server: NodeCGServer }>({ server })
		.extend<{
			apis: { extension: InstanceType<ReturnType<typeof serverApiFactory>> };
		}>({
			apis: async ({ server }, use) => {
				await use({ extension: server.getExtensions()[C.bundleName()] as any });
			},
		})
		.extend<{ browser: puppeteer.Browser }>({
			browser: async ({}, use) => {
				// The --no-sandbox flag is required to run Headless Chrome on CI
				const args = isCi ? ["--no-sandbox"] : undefined;
				const browser = await puppeteer.launch({
					headless: true,
					args,
				});

				await use(browser);

				await browser.close();
			},
		})
		.extend<{
			initDashboard: () => Promise<puppeteer.Page>;
			initStandalone: () => Promise<puppeteer.Page>;
			initGraphic: () => Promise<puppeteer.Page>;
			initSingleInstance: () => Promise<puppeteer.Page>;
			initLogin: () => Promise<puppeteer.Page>;
		}>({
			initDashboard: async ({ browser }, use) => {
				const page = await browser.newPage();
				await use(async () => {
					await page.goto(C.dashboardUrl());
					await page.waitForFunction(
						() => typeof window.dashboardApi !== "undefined",
					);
					await page.waitForFunction(() => window.WebComponentsReady);
					return page;
				});
				await page.close();
			},
			initStandalone: async ({ browser }, use) => {
				const page = await browser.newPage();
				await use(async () => {
					await page.goto(`${C.testPanelUrl()}?standalone=true`);
					await page.waitForFunction(
						() => typeof window.dashboardApi !== "undefined",
					);
					return page;
				});
				await page.close();
			},
			initGraphic: async ({ browser }, use) => {
				const page = await browser.newPage();
				await use(async () => {
					await page.goto(C.graphicUrl());
					await page.waitForFunction(
						() => typeof window.graphicApi !== "undefined",
					);
					return page;
				});
				await page.close();
			},
			initSingleInstance: async ({ browser }, use) => {
				const page = await browser.newPage();
				await use(async () => {
					await page.goto(C.singleInstanceUrl());
					await page.waitForFunction(() => {
						if (window.location.pathname.endsWith("busy.html")) {
							return true;
						}
						if (window.location.pathname.endsWith("killed.html")) {
							return true;
						}
						return typeof window.singleInstanceApi !== "undefined";
					});
					await setTimeout(500);
					return page;
				});
				await page.close();
			},
			initLogin: async ({ browser }, use) => {
				const page = await browser.newPage();
				await use(async () => {
					await page.goto(C.loginUrl());
					return page;
				});
				await page.close();
			},
		});
}
