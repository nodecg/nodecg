import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { Chunk, Effect, Fiber, Layer, Option, Stream } from "effect";
import { afterAll, beforeAll, expect, test } from "vitest";

import { testDirPath } from "../../../test/helpers/test-dir-path.js";
import { createTmpDir } from "../../../test/helpers/tmp-dir.js";
import { NodecgConfig } from "../_effect/nodecg-config.js";
import { NodecgPackageJson } from "../_effect/nodecg-package-json.js";
import { testEffect } from "../_effect/test-effect.js";
import {
	type BundleEvent,
	bundleEvent,
	BundleManager,
} from "./bundle-manager.js";

const tmpDir = createTmpDir();

const TestNodecgPackageJsonLayer = Layer.succeed(
	NodecgPackageJson,
	NodecgPackageJson.make({ version: "0.7.0" }),
);

const TestNodecgConfigLayer = Layer.succeed(
	NodecgConfig,
	NodecgConfig.make({
		baseURL: "localhost:9090",
		host: "localhost",
		port: 9090,
		exitOnUncaught: false,
		logging: {
			console: {
				enabled: true,
				level: "info",
				timestamps: false,
				replicants: false,
			},
			file: {
				enabled: false,
				level: "info",
				timestamps: true,
				replicants: false,
				path: "logs/nodecg.log",
			},
		},
		bundles: {
			enabled: null,
			disabled: ["test-disabled-bundle"],
			paths: [
				path.join(tmpDir, "bundles"),
				path.join(tmpDir, "custom-bundles"),
			],
		},
		login: {
			enabled: false,
			forceHttpsReturn: false,
			sessionSecret: "",
			local: undefined,
			steam: undefined,
			twitch: undefined,
			discord: undefined,
		},
		ssl: {
			enabled: false,
			allowHTTP: false,
			keyPath: undefined,
			certificatePath: undefined,
			passphrase: undefined,
		},
		sentry: {
			enabled: false,
			dsn: "",
		},
	}),
);

const testLayer = Layer.provideMerge(
	BundleManager.Default,
	Layer.merge(TestNodecgPackageJsonLayer, TestNodecgConfigLayer),
);

afterAll(async () => {
	try {
		await fs.promises.rm(tmpDir, { recursive: true, force: true });
	} catch (error) {
		// Ignore error
		console.error(error);
	}
});

beforeAll(() => {
	process.env.NODECG_ROOT = tmpDir;
	fs.cpSync(testDirPath("fixtures/bundle-manager"), tmpDir, {
		recursive: true,
	});

	// The symlink test can't run on Windows unless run with admin privs.
	// For some reason, creating symlinks on Windows requires admin.
	if (os.platform() !== "win32") {
		fs.symlinkSync(
			path.join(tmpDir, "change-panel-symlink-target"),
			path.join(tmpDir, "bundles/change-panel-symlink"),
		);
	}
});

test(
	"loader - should detect and load bundle configuration files",
	testEffect(
		Effect.gen(function* () {
			const bundleManager = yield* BundleManager;
			let bundle = bundleManager.find("config-test-json");
			expect(bundle?.config).toEqual({ bundleConfig: true });
			bundle = bundleManager.find("config-test-yaml");
			expect(bundle?.config).toEqual({ bundleConfig: true });
			bundle = bundleManager.find("config-test-js");
			expect(bundle?.config).toEqual({ bundleConfig: true });
		}).pipe(Effect.provide(testLayer)),
	),
);

test(
	"loader - should not load bundles with a non-satisfactory nodecg.compatibleRange",
	testEffect(
		Effect.gen(function* () {
			const bundleManager = yield* BundleManager;
			const bundle = bundleManager.find("incompatible-range");
			expect(bundle).toBe(undefined);
		}).pipe(Effect.provide(testLayer)),
	),
);

test(
	"loader - should not load a bundle that has been disabled",
	testEffect(
		Effect.gen(function* () {
			const bundleManager = yield* BundleManager;
			const bundle = bundleManager.find("test-disabled-bundle");
			expect(bundle).toBe(undefined);
		}).pipe(Effect.provide(testLayer)),
	),
);

test(
	"loader - should not crash or load an invalid bundle",
	testEffect(
		Effect.gen(function* () {
			const bundleManager = yield* BundleManager;
			const bundle = bundleManager.find("node_modules");
			expect(bundle).toBe(undefined);
		}).pipe(Effect.provide(testLayer)),
	),
);

test(
	"loader - should detect and load bundle located in custom bundle paths",
	testEffect(
		Effect.gen(function* () {
			const bundleManager = yield* BundleManager;
			const bundle = bundleManager.find("another-test-bundle");
			expect(bundle?.name).toBe("another-test-bundle");
		}).pipe(Effect.provide(testLayer)),
	),
);

test(
	"watcher - should emit a change event when the manifest file changes",
	testEffect(
		Effect.gen(function* () {
			const bundleManager = yield* BundleManager;

			const manifest = JSON.parse(
				fs.readFileSync(
					`${tmpDir}/bundles/change-manifest/package.json`,
					"utf8",
				),
			);

			// Subscribe to events before making the change
			const eventStream = yield* bundleManager.subscribe();

			// Fork the stream consumer to wait for the event
			const resultFiber = yield* eventStream.pipe(
				Stream.filter(bundleEvent.$is("bundleChanged")),
				Stream.filter((event) => event.bundle.name === "change-manifest"),
				Stream.take(1),
				Stream.runCollect,
				Effect.map(Chunk.head),
				Effect.fork,
			);

			// Make the file change
			manifest._changed = true;
			yield* Effect.sleep("100 millis");
			fs.writeFileSync(
				`${tmpDir}/bundles/change-manifest/package.json`,
				JSON.stringify(manifest),
				"utf8",
			);

			// Wait for the event with timeout
			const result = yield* Fiber.join(resultFiber).pipe(
				Effect.map(Option.getOrThrow),
			);

			expect(result.bundle.name).toBe("change-manifest");
		}).pipe(Effect.provide(testLayer)),
	),
);

test(
	"watcher - should emit a change event when a panel HTML file changes",
	testEffect(
		Effect.gen(function* () {
			const bundleManager = yield* BundleManager;

			// Wait for the watcher to be ready
			yield* bundleManager.waitForReady();

			// Subscribe to events before making the change
			const eventStream = yield* bundleManager.subscribe();

			// Fork the stream consumer to wait for the event
			const resultFiber = yield* eventStream.pipe(
				Stream.filter(
					(event): event is BundleEvent & { _tag: "bundleChanged" } =>
						event._tag === "bundleChanged" &&
						event.bundle.name === "change-panel",
				),
				Stream.take(1),
				Stream.runCollect,
				Effect.map(Chunk.head),
				Effect.fork,
			);

			// Make the file change
			const panelPath = `${tmpDir}/bundles/change-panel/dashboard/panel.html`;
			let panel = fs.readFileSync(panelPath, "utf8");
			panel += "\n";
			fs.writeFileSync(panelPath, panel);

			// Wait for the event with timeout
			const result = yield* Fiber.join(resultFiber).pipe(
				Effect.map(Option.getOrThrow),
				Effect.timeoutFail({
					duration: "10 seconds",
					onTimeout: () =>
						new Error("Timed out waiting for bundleChanged event"),
				}),
			);

			expect(result.bundle.name).toBe("change-panel");
		}).pipe(Effect.provide(testLayer)),
	),
);

if (os.platform() !== "win32") {
	// This can't be tested on Windows unless run with admin privs.
	// For some reason, creating symlinks on Windows requires admin.
	test(
		"watcher - should detect panel HTML file changes when the bundle is symlinked",
		testEffect(
			Effect.gen(function* () {
				const bundleManager = yield* BundleManager;

				// Wait for the watcher to be ready
				yield* bundleManager.waitForReady();

				// Subscribe to events before making the change
				const eventStream = yield* bundleManager.subscribe();

				// Fork the stream consumer to wait for the event
				const resultFiber = yield* eventStream.pipe(
					Stream.filter(
						(event): event is BundleEvent & { _tag: "bundleChanged" } =>
							event._tag === "bundleChanged" &&
							event.bundle.name === "change-panel-symlink",
					),
					Stream.take(1),
					Stream.runCollect,
					Effect.map(Chunk.head),
					Effect.fork,
				);

				// Make the file change
				const panelPath = `${tmpDir}/bundles/change-panel-symlink/dashboard/panel.html`;
				let panel = fs.readFileSync(panelPath, "utf8");
				panel += "\n";
				fs.writeFileSync(panelPath, panel);

				// Wait for the event with timeout
				const result = yield* Fiber.join(resultFiber).pipe(
					Effect.map(Option.getOrThrow),
					Effect.timeoutFail({
						duration: "10 seconds",
						onTimeout: () =>
							new Error("Timed out waiting for bundleChanged event"),
					}),
				);

				expect(result.bundle.name).toBe("change-panel-symlink");
			}).pipe(Effect.provide(testLayer)),
		),
	);
}

test(
	"watcher - should reload the bundle's config when the bundle is reloaded due to a change",
	testEffect(
		Effect.gen(function* () {
			const bundleManager = yield* BundleManager;

			// Wait for the watcher to be ready
			yield* bundleManager.waitForReady();

			const manifest = JSON.parse(
				fs.readFileSync(`${tmpDir}/bundles/change-config/package.json`, "utf8"),
			);
			const config = JSON.parse(
				fs.readFileSync(`${tmpDir}/cfg/change-config.json`, "utf8"),
			);

			// Subscribe to events before making the change
			const eventStream = yield* bundleManager.subscribe();

			// Fork the stream consumer to wait for the event
			const resultFiber = yield* eventStream.pipe(
				Stream.filter(
					(event): event is BundleEvent & { _tag: "bundleChanged" } =>
						event._tag === "bundleChanged" &&
						event.bundle.name === "change-config",
				),
				Stream.take(1),
				Stream.runCollect,
				Effect.map(Chunk.head),
				Effect.fork,
			);

			// Make the file changes
			config._changed = true;
			manifest._changed = true;
			fs.writeFileSync(
				`${tmpDir}/bundles/change-config/package.json`,
				JSON.stringify(manifest),
			);
			fs.writeFileSync(
				`${tmpDir}/cfg/change-config.json`,
				JSON.stringify(config),
			);

			// Wait for the event with timeout
			const result = yield* Fiber.join(resultFiber).pipe(
				Effect.map(Option.getOrThrow),
				Effect.timeoutFail({
					duration: "10 seconds",
					onTimeout: () =>
						new Error("Timed out waiting for bundleChanged event"),
				}),
			);

			expect(result.bundle.name).toBe("change-config");
			expect(result.bundle.config).toEqual({
				bundleConfig: true,
				_changed: true,
			});
		}).pipe(Effect.provide(testLayer)),
	),
);

test(
	"watcher - should emit an `invalidBundle` error when a panel HTML file is removed",
	testEffect(
		Effect.gen(function* () {
			const bundleManager = yield* BundleManager;

			// Subscribe to events before making the change
			const eventStream = yield* bundleManager.subscribe();

			// Fork the stream consumer to wait for the event
			const resultFiber = yield* eventStream.pipe(
				Stream.filter(bundleEvent.$is("invalidBundle")),
				Stream.take(1),
				Stream.runCollect,
				Effect.map(Chunk.head),
				Effect.fork,
			);

			// Make the file change
			yield* Effect.sleep("100 millis");
			fs.unlinkSync(`${tmpDir}/bundles/remove-panel/dashboard/panel.html`);

			// Wait for the event with timeout
			const result = yield* Fiber.join(resultFiber).pipe(
				Effect.map(Option.getOrThrow),
				Effect.timeout("10 seconds"),
			);

			expect(result.bundle.name).toBe("remove-panel");
			expect((result.error as Error).message).toBe(
				'Panel file "panel.html" in bundle "remove-panel" does not exist.',
			);
		}).pipe(Effect.provide(testLayer)),
	),
);
