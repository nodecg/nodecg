import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { setTimeout as legacySetTimeout } from "node:timers";
import { setTimeout } from "node:timers/promises";

import { afterAll, beforeAll, expect, test } from "vitest";

import type { BundleManager as BundleManagerTypeOnly } from "../src/server/bundle-manager";
import { createTmpDir } from "./helpers/tmp-dir";

const tmpDir = await createTmpDir();

afterAll(async () => {
	try {
		await fs.promises.rm(tmpDir, { recursive: true, force: true });
	} catch (error) {
		// Ignore error
		console.error(error);
	}
});

let bundleManager: BundleManagerTypeOnly;
beforeAll(async () => {
	process.env.NODECG_ROOT = tmpDir;
	fs.cpSync("test/fixtures/bundle-manager", tmpDir, { recursive: true });

	// The symlink test can't run on Windows unless run with admin privs.
	// For some reason, creating symlinks on Windows requires admin.
	if (os.platform() !== "win32") {
		fs.symlinkSync(
			path.join(tmpDir, "change-panel-symlink-target"),
			path.join(tmpDir, "bundles/change-panel-symlink"),
		);
	}

	const nodecgConfig = {
		bundles: {
			disabled: ["test-disabled-bundle"],
		},
	};

	/**
	 * Delay import so that we have time to set process.env.NODECG_ROOT first.
	 */
	const { BundleManager } = await import("../src/server/bundle-manager");
	bundleManager = new BundleManager(
		[path.join(tmpDir, "bundles"), path.join(tmpDir, "custom-bundles")],
		path.join(tmpDir, "cfg"),
		"0.7.0",
		nodecgConfig,
	);

	// Wait for Chokidar to finish its initial scan.
	await new Promise<void>((resolve, reject) => {
		let handled = false;
		const timeout = legacySetTimeout(() => {
			if (handled) return;
			handled = true;
			reject(
				new Error(
					"Timed out while waiting for the bundle manager to become ready.",
				),
			);
		}, 15000);

		if (bundleManager.ready) {
			succeed();
		} else {
			bundleManager.once("ready", () => {
				succeed();
			});
		}

		function succeed() {
			if (handled) return;
			handled = true;
			clearTimeout(timeout);
			resolve();
		}
	});
});

test("loader - should detect and load bundle configuration files", () => {
	let bundle = bundleManager.find("config-test-json");
	expect(bundle?.config).toEqual({ bundleConfig: true });
	bundle = bundleManager.find("config-test-yaml");
	expect(bundle?.config).toEqual({ bundleConfig: true });
	bundle = bundleManager.find("config-test-js");
	expect(bundle?.config).toEqual({ bundleConfig: true });
});

test("loader - should not load bundles with a non-satisfactory nodecg.compatibleRange", () => {
	const bundle = bundleManager.find("incompatible-range");
	expect(bundle).toBe(undefined);
});

test("loader - should not load a bundle that has been disabled", () => {
	const bundle = bundleManager.find("test-disabled-bundle");
	expect(bundle).toBe(undefined);
});

test("loader - should not crash or load an invalid bundle", () => {
	const bundle = bundleManager.find("node_modules");
	expect(bundle).toBe(undefined);
});

test("loader - should detect and load bundle located in custom bundle paths", () => {
	const bundle = bundleManager.find("another-test-bundle");
	expect(bundle?.name).toBe("another-test-bundle");
});

test("watcher - should emit a change event when the manifest file changes", async () => {
	const manifest = JSON.parse(
		fs.readFileSync(`${tmpDir}/bundles/change-manifest/package.json`, "utf8"),
	);

	const promise = new Promise<string>((resolve, reject) => {
		bundleManager.once("bundleChanged", (bundle) => {
			resolve(bundle.name);
		});
		bundleManager.once("invalidBundle", (bundle, error) => {
			reject(
				new Error(
					`Received an "invalid-bundle" event for bundle "${bundle.name}": ${error.message}`,
				),
			);
		});
	});

	manifest._changed = true;
	await setTimeout(100);
	fs.writeFileSync(
		`${tmpDir}/bundles/change-manifest/package.json`,
		JSON.stringify(manifest),
		"utf8",
	);

	expect(await promise).toBe("change-manifest");
});

test("watcher - should emit a change event when a panel HTML file changes", async () => {
	const promise = new Promise<void>((resolve) => {
		bundleManager.once("bundleChanged", (bundle) => {
			expect(bundle.name).toBe("change-panel");
			resolve();
		});
	});

	const panelPath = `${tmpDir}/bundles/change-panel/dashboard/panel.html`;
	let panel = fs.readFileSync(panelPath, "utf8");
	panel += "\n";
	fs.writeFileSync(panelPath, panel);

	await promise;
});

if (os.platform() !== "win32") {
	// This can't be tested on Windows unless run with admin privs.
	// For some reason, creating symlinks on Windows requires admin.
	test("watcher - should detect panel HTML file changes when the bundle is symlinked", async () => {
		const promise = new Promise<void>((resolve) => {
			bundleManager.once("bundleChanged", (bundle) => {
				expect(bundle.name).toBe("change-panel-symlink");
				resolve();
			});
		});

		const panelPath = `${tmpDir}/bundles/change-panel-symlink/dashboard/panel.html`;
		let panel = fs.readFileSync(panelPath, "utf8");
		panel += "\n";
		fs.writeFileSync(panelPath, panel);

		await promise;
	});
}

test("watcher - should reload the bundle's config when the bundle is reloaded due to a change", async () => {
	const manifest = JSON.parse(
		fs.readFileSync(`${tmpDir}/bundles/change-config/package.json`, "utf8"),
	);
	const config = JSON.parse(
		fs.readFileSync(`${tmpDir}/cfg/change-config.json`, "utf8"),
	);

	const promise = new Promise<void>((resolve) => {
		bundleManager.once("bundleChanged", (bundle) => {
			expect(bundle.name).toBe("change-config");
			expect(bundle.config).toEqual({
				bundleConfig: true,
				_changed: true,
			});
			resolve();
		});
	});

	config._changed = true;
	manifest._changed = true;
	fs.writeFileSync(
		`${tmpDir}/bundles/change-config/package.json`,
		JSON.stringify(manifest),
	);
	fs.writeFileSync(`${tmpDir}/cfg/change-config.json`, JSON.stringify(config));

	await promise;
});

test("watcher - should emit an `invalidBundle` error when a panel HTML file is removed", async () => {
	const promise = new Promise<void>((resolve) => {
		bundleManager.once("invalidBundle", (bundle, error) => {
			expect(bundle.name).toBe("remove-panel");
			expect(error.message).toBe(
				'Panel file "panel.html" in bundle "remove-panel" does not exist.',
			);
			resolve();
		});
	});

	fs.unlinkSync(`${tmpDir}/bundles/remove-panel/dashboard/panel.html`);

	await promise;
});
