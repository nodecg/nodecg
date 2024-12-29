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
import { getConnection } from "../../src/server/database/default/connection";
import type { NodeCGServer } from "../../src/server/server";
import { populateTestData } from "./populateTestData";
import * as C from "./test-constants";

const tmpdir = os.tmpdir();

function createTmpDir() {
	const dir = path.join(tmpdir, randomUUID());
	fs.mkdirSync(dir, { recursive: true });
	return dir;
}

export interface SetupContext {
	server: NodeCGServer;
	apis: { extension: InstanceType<ReturnType<typeof serverApiFactory>> };
	browser: puppeteer.Browser;
	dashboard: puppeteer.Page;
	standalone: puppeteer.Page;
	graphic: puppeteer.Page;
	singleInstance: puppeteer.Page;
	loginPage: puppeteer.Page;
	database: Awaited<ReturnType<typeof getConnection>>;
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

	let browser: puppeteer.Browser | null = null;

	afterAll(async () => {
		await server.stop();
		fse.removeSync(tempFolder);

		if (browser) {
			await browser.close();
		}
	});

	return test
		.extend<Pick<SetupContext, "server" | "apis">>({
			server,
			apis: {
				extension: server.getExtensions()[C.bundleName()] as InstanceType<
					ReturnType<typeof serverApiFactory>
				>,
			},
		})
		.extend<Pick<SetupContext, "browser">>({
			browser: async ({}, use) => {
				if (browser) {
					await use(browser);
				} else {
					const args = isCi ? ["--no-sandbox"] : undefined;
					browser = await puppeteer.launch({
						headless: true,
						args,
					});

					await use(browser);
				}
			},
		})
		.extend<
			Pick<
				SetupContext,
				"dashboard" | "standalone" | "graphic" | "singleInstance" | "loginPage"
			>
		>({
			dashboard: async ({ browser }, use) => {
				const page = await browser.newPage();
				await page.goto(C.dashboardUrl());
				await page.waitForFunction(
					() => typeof window.dashboardApi !== "undefined",
				);
				await page.waitForFunction(() => window.WebComponentsReady);
				await use(page);
				await page.close();
			},
			standalone: async ({ browser }, use) => {
				const page = await browser.newPage();
				await page.goto(`${C.testPanelUrl()}?standalone=true`);
				await page.waitForFunction(
					() => typeof window.dashboardApi !== "undefined",
				);
				await use(page);
				await page.close();
			},
			graphic: async ({ browser }, use) => {
				const page = await browser.newPage();
				await page.goto(C.graphicUrl());
				await page.waitForFunction(
					() => typeof window.graphicApi !== "undefined",
				);
				await use(page);
				await page.close();
			},
			singleInstance: async ({ browser }, use) => {
				const page = await browser.newPage();
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
				await use(page);
				await page.close();
			},
			loginPage: async ({ browser }, use) => {
				const page = await browser.newPage();
				await page.goto(C.loginUrl());
				await use(page);
				await page.close();
			},
		})
		.extend<Pick<SetupContext, "database">>({
			database: async ({}, use) => {
				const database = await getConnection();
				await use(database);
			},
		});
}
