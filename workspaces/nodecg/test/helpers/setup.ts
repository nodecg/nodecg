import fs from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";

import { getConnection } from "@nodecg/database-adapter-sqlite-legacy";
import isCi from "is-ci";
import * as puppeteer from "puppeteer";
import { afterAll, test } from "vitest";

import type { serverApiFactory } from "../../src/server/api.server";
import type { NodeCGServer } from "../../src/server/server";
import { populateTestData } from "./populateTestData";
import * as C from "./test-constants";
import { testDirPath } from "./test-dir-path";
import { createTmpDir } from "./tmp-dir";

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
	const tmpDir = createTmpDir();

	// Tell NodeCG to look in our new temp folder for bundles, cfg, db, and assets, rather than whatever ones the user
	// may have. We don't want to touch any existing user data!
	process.env.NODECG_ROOT = tmpDir;

	fs.cpSync(
		testDirPath("fixtures/nodecg-core/assets"),
		path.join(tmpDir, "assets"),
		{
			recursive: true,
		},
	);
	fs.cpSync(
		testDirPath("fixtures/nodecg-core/bundles"),
		path.join(tmpDir, "bundles"),
		{
			recursive: true,
		},
	);
	fs.renameSync(
		path.join(tmpDir, "bundles/test-bundle/git"),
		path.join(tmpDir, "bundles/test-bundle/.git"),
	);
	fs.cpSync(testDirPath("fixtures/nodecg-core/cfg"), path.join(tmpDir, "cfg"), {
		recursive: true,
	});
	fs.cpSync(
		testDirPath(`fixtures/nodecg-core/cfg/${nodecgConfigName}`),
		path.join(tmpDir, "cfg/nodecg.json"),
		{ recursive: true },
	);
	fs.writeFileSync(
		path.join(tmpDir, "should-be-forbidden.txt"),
		"exploit succeeded",
		"utf-8",
	);

	const { NodeCGServer } = await import("../../src/server/server");
	const server = new NodeCGServer();

	await populateTestData();
	await server.start();

	let browser: puppeteer.Browser | null = null;

	let dashboard: puppeteer.Page | null = null;
	let standalone: puppeteer.Page | null = null;
	let graphic: puppeteer.Page | null = null;
	let singleInstance: puppeteer.Page | null = null;
	let loginPage: puppeteer.Page | null = null;

	afterAll(async () => {
		await Promise.all([
			browser?.close(),
			server.stop(),
			fs.promises
				.rm(tmpDir, { recursive: true, force: true })
				.catch((error) => {
					// Ignore errors when cleaning up the temp folder
					console.error(error);
				}),
		]);
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
				if (!dashboard) {
					const page = await browser.newPage();
					await page.goto(C.dashboardUrl());
					await page.waitForFunction(
						() => typeof window.dashboardApi !== "undefined",
					);
					await page.waitForFunction(() => window.WebComponentsReady);
					dashboard = page;
				}
				await use(dashboard);
			},
			standalone: async ({ browser }, use) => {
				if (!standalone) {
					const page = await browser.newPage();
					await page.goto(`${C.testPanelUrl()}?standalone=true`);
					await page.waitForFunction(
						() => typeof window.dashboardApi !== "undefined",
					);
					standalone = page;
				}
				await use(standalone);
			},
			graphic: async ({ browser }, use) => {
				if (!graphic) {
					const page = await browser.newPage();
					await page.goto(C.graphicUrl());
					await page.waitForFunction(
						() => typeof window.graphicApi !== "undefined",
					);
					graphic = page;
				}
				await use(graphic);
			},
			singleInstance: async ({ browser }, use) => {
				if (!singleInstance) {
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
					singleInstance = page;
				}
				await use(singleInstance);
			},
			loginPage: async ({ browser }, use) => {
				if (!loginPage) {
					const page = await browser.newPage();
					await page.goto(C.loginUrl());
					loginPage = page;
				}
				await use(loginPage);
			},
		})
		.extend<Pick<SetupContext, "database">>({
			database: async ({}, use) => {
				const database = await getConnection();
				await use(database);
			},
		});
}
