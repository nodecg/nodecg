import fs from "node:fs";
import path from "node:path";
import { setTimeout } from "node:timers/promises";
import { pathToFileURL } from "node:url";

import type { getConnection } from "@nodecg/database-adapter-sqlite-legacy";
import { Deferred, Effect, Fiber, Layer } from "effect";
import isCi from "is-ci";
import * as puppeteer from "puppeteer";
import { afterAll, test } from "vitest";

import type { serverApiFactory } from "../../src/server/api.server";
import type { createServer } from "../../src/server/server";
import { populateTestData } from "../helpers/populateTestData";
import * as C from "../helpers/test-constants";
import { testDirPath } from "../helpers/test-dir-path";
import { createTmpDir } from "../helpers/tmp-dir";
import { NodecgPackageJson } from "../../src/server/_effect/nodecg-package-json.ts";

type ServerHandle = Effect.Effect.Success<ReturnType<typeof createServer>>;

interface TestServerWrapper {
	start: () => Promise<void>;
	stop: () => Promise<void>;
	getExtensions: ServerHandle["getExtensions"];
	saveAllReplicantsNow: ServerHandle["saveAllReplicantsNow"];
	handle: ServerHandle;
	bundleManager: ServerHandle["bundleManager"];
}

export interface SetupContext {
	server: TestServerWrapper;
	apis: { extension: InstanceType<ReturnType<typeof serverApiFactory>> };
	browser: puppeteer.Browser;
	dashboard: puppeteer.Page;
	standalone: puppeteer.Page;
	graphic: puppeteer.Page;
	singleInstance: puppeteer.Page;
	loginPage: puppeteer.Page;
	database: Awaited<ReturnType<typeof getConnection>>;
}

export async function setupInstalledModeTest(nodecgConfigName = "nodecg.json") {
	const tmpDir = createTmpDir();

	// Copy test-bundle contents directly to tmpDir root (tmpDir IS the bundle)
	const testBundlePath = testDirPath(
		"fixtures/nodecg-core/bundles/test-bundle",
		true,
	);
	fs.cpSync(testBundlePath, tmpDir, {
		recursive: true,
		filter: (src) => {
			// Skip git directory during initial copy, we'll rename it after
			return !src.endsWith("/git");
		},
	});

	// Rename git → .git
	const gitPath = path.join(testBundlePath, "git");
	if (fs.existsSync(gitPath)) {
		fs.cpSync(gitPath, path.join(tmpDir, ".git"), { recursive: true });
	}

	// Copy NodeCG configuration
	fs.cpSync(
		testDirPath("fixtures/nodecg-core/cfg", true),
		path.join(tmpDir, "cfg"),
		{
			recursive: true,
		},
	);
	fs.cpSync(
		testDirPath(`fixtures/nodecg-core/cfg/${nodecgConfigName}`, true),
		path.join(tmpDir, "cfg/nodecg.json"),
		{ recursive: true },
	);

	// Copy test assets (bundle's assets)
	fs.cpSync(
		testDirPath("fixtures/nodecg-core/assets", true),
		path.join(tmpDir, "assets"),
		{
			recursive: true,
		},
	);

	// Create test security file
	fs.writeFileSync(
		path.join(tmpDir, "should-be-forbidden.txt"),
		"exploit succeeded",
		"utf-8",
	);

	// Copy entire node_modules directory (includes all dependencies and @nodecg/* workspaces)
	fs.cpSync(
		testDirPath("../../../node_modules"),
		path.join(tmpDir, "node_modules"),
		{ recursive: true },
	);
	if (fs.existsSync(testDirPath("../node_modules"))) {
		fs.cpSync(
			testDirPath("../node_modules"),
			path.join(tmpDir, "node_modules"),
			{ recursive: true },
		);
	}

	// Create node_modules/nodecg and copy the current NodeCG project into it
	const nodecgModulePath = path.join(tmpDir, "node_modules/nodecg");

	// Change cwd and set NODECG_ROOT before importing NodeCGServer
	// This ensures isLegacyProject check works correctly
	process.chdir(tmpDir);
	process.env.NODECG_ROOT = tmpDir;

	// Dynamic imports AFTER NODECG_ROOT is set to ensure config loads from tmpDir
	const [{ NodecgConfig }, { BundleManager }] = await Promise.all([
		import("../../src/server/_effect/nodecg-config.ts"),
		import("../../src/server/server/bundle-manager.ts"),
	]);

	// Dynamically import createServer from the installed location
	const serverModulePath = pathToFileURL(
		path.join(nodecgModulePath, "src/server/server/index.ts"),
	).href;
	const { createServer } = (await import(serverModulePath)) as {
		createServer: typeof import("../../src/server/server").createServer;
	};

	let serverHandle: ServerHandle;
	let mainFiber: Fiber.RuntimeFiber<void, unknown> | null = null;

	const server: TestServerWrapper = {
		start: async () => {
			await populateTestData();

			const TestNodecgPackageJsonLayer = Layer.succeed(
				NodecgPackageJson,
				NodecgPackageJson.make({ version: "0.0.0" }),
			);
			const testLayer = Layer.provideMerge(
				BundleManager.Default,
				Layer.merge(NodecgConfig.Default, TestNodecgPackageJsonLayer),
			);

			await Effect.runPromise(
				Effect.gen(function* () {
					const ready = yield* Deferred.make<void>();
					mainFiber = yield* Effect.forkDaemon(
						Effect.gen(function* () {
							const handle = yield* createServer(ready);
							serverHandle = handle;
							yield* handle.run();
						}).pipe(Effect.scoped, Effect.provide(testLayer)),
					);
					yield* Deferred.await(ready);
				}),
			);
		},
		stop: async () => {
			if (mainFiber) {
				await Effect.runPromise(Fiber.interrupt(mainFiber));
			}
		},
		getExtensions: () => {
			return serverHandle.getExtensions();
		},
		saveAllReplicantsNow: () => {
			return serverHandle.saveAllReplicantsNow();
		},
		get handle() {
			return serverHandle;
		},
		get bundleManager() {
			return serverHandle.bundleManager;
		},
	};

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
				const { getConnection } = await import(
					"@nodecg/database-adapter-sqlite-legacy"
				);
				const database = await getConnection();
				await use(database);
			},
		});
}
