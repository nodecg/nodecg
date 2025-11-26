import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { NodeFileSystem } from "@effect/platform-node";
import {
	Chunk,
	Effect,
	Exit,
	Fiber,
	Layer,
	Option,
	Scope,
	Stream,
} from "effect";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { testDirPath } from "../../../test/helpers/test-dir-path";
import { createTmpDir } from "../../../test/helpers/tmp-dir";

const tmpDir = createTmpDir();

afterAll(async () => {
	try {
		await fs.promises.rm(tmpDir, { recursive: true, force: true });
	} catch (error) {
		console.error(error);
	}
});

// Will be set in beforeAll after dynamic import
let BundleManager: typeof import("./bundle-manager").BundleManager;
type BM = Effect.Effect.Success<
	typeof import("./bundle-manager").BundleManager
>;
let bundleManagerInstance: BM;
let scope: Scope.CloseableScope;

beforeAll(async () => {
	// Set NODECG_ROOT before importing bundle-manager
	process.env.NODECG_ROOT = tmpDir;

	fs.cpSync(testDirPath("fixtures/bundle-manager"), tmpDir, {
		recursive: true,
	});

	// The symlink test can't run on Windows unless run with admin privs.
	if (os.platform() !== "win32") {
		fs.symlinkSync(
			path.join(tmpDir, "change-panel-symlink-target"),
			path.join(tmpDir, "bundles/change-panel-symlink"),
		);
	}

	// Dynamic import after NODECG_ROOT is set
	const bundleManagerModule = await import("./bundle-manager.js");
	BundleManager = bundleManagerModule.BundleManager;

	const { GitService } = await import("../_effect/git-service.js");
	const { NodecgVersion } = await import("../_effect/nodecg-version.js");

	// Mock NodecgVersion to return 0.7.0 (matches test fixtures)
	const TestNodecgVersion = Layer.succeed(
		NodecgVersion,
		NodecgVersion.make({ version: "0.7.0" }),
	);

	// Create shared layer
	const TestLayer = Layer.mergeAll(
		GitService.Default.pipe(Layer.provide(NodeFileSystem.layer)),
		NodeFileSystem.layer,
		TestNodecgVersion,
	);
	const BundleManagerLayer = BundleManager.Default.pipe(
		Layer.provide(TestLayer),
	);

	// Create a shared scope and BundleManager instance
	scope = Effect.runSync(Scope.make());

	const runtime = await Effect.runPromise(
		Layer.toRuntime(BundleManagerLayer).pipe(Scope.extend(scope)),
	);

	bundleManagerInstance = runtime.context.unsafeMap.get(
		BundleManager.key,
	) as BM;

	// Wait for ready (needs scope for internal subscription)
	await Effect.runPromise(
		bundleManagerInstance.waitForReady().pipe(Effect.scoped),
	);
});

afterAll(async () => {
	if (scope) {
		await Effect.runPromise(Scope.close(scope, Exit.void));
	}
});

describe("BundleManager", () => {
	test("loader - should detect and load bundle configuration files", async () => {
		let bundle = await Effect.runPromise(
			bundleManagerInstance.find("config-test-json"),
		);
		expect(bundle?.config).toEqual({ bundleConfig: true });

		bundle = await Effect.runPromise(
			bundleManagerInstance.find("config-test-yaml"),
		);
		expect(bundle?.config).toEqual({ bundleConfig: true });

		bundle = await Effect.runPromise(
			bundleManagerInstance.find("config-test-js"),
		);
		expect(bundle?.config).toEqual({ bundleConfig: true });
	});

	test("loader - should not load bundles with a non-satisfactory nodecg.compatibleRange", async () => {
		const bundle = await Effect.runPromise(
			bundleManagerInstance.find("incompatible-range"),
		);
		expect(bundle).toBe(undefined);
	});

	test("loader - should not load a bundle that has been disabled", async () => {
		const bundle = await Effect.runPromise(
			bundleManagerInstance.find("test-disabled-bundle"),
		);
		expect(bundle).toBe(undefined);
	});

	test("loader - should not crash or load an invalid bundle", async () => {
		const bundle = await Effect.runPromise(
			bundleManagerInstance.find("node_modules"),
		);
		expect(bundle).toBe(undefined);
	});

	test("loader - should detect and load bundle located in custom bundle paths", async () => {
		const bundle = await Effect.runPromise(
			bundleManagerInstance.find("another-test-bundle"),
		);
		expect(bundle?.name).toBe("another-test-bundle");
	});

	test("watcher - should emit a change event when the manifest file changes", async () => {
		const manifest = JSON.parse(
			fs.readFileSync(`${tmpDir}/bundles/change-manifest/package.json`, "utf8"),
		);

		// Keep scope alive for entire operation: subscribe, fork consumer, modify file, wait
		const eventOption = await Effect.runPromise(
			Effect.gen(function* () {
				const stream = yield* bundleManagerInstance.listenTo("bundleChanged");

				// Fork consumer before modifying file
				const fiber = yield* Effect.fork(
					stream.pipe(
						Stream.take(1),
						Stream.runCollect,
						Effect.map(Chunk.head),
					),
				);

				// Small delay to ensure subscription is active
				yield* Effect.sleep("100 millis");

				// Modify the manifest
				manifest._changed = true;
				fs.writeFileSync(
					`${tmpDir}/bundles/change-manifest/package.json`,
					JSON.stringify(manifest),
					"utf8",
				);

				// Wait for the event with timeout
				return yield* Fiber.join(fiber).pipe(Effect.timeout("10 seconds"));
			}).pipe(Effect.scoped),
		);

		expect(Option.isSome(eventOption)).toBe(true);
		if (Option.isSome(eventOption)) {
			expect(eventOption.value.bundle.name).toBe("change-manifest");
		}
	});

	test("watcher - should emit a change event when a panel HTML file changes", async () => {
		const panelPath = `${tmpDir}/bundles/change-panel/dashboard/panel.html`;

		const eventOption = await Effect.runPromise(
			Effect.gen(function* () {
				// Wait for any pending events from previous tests to settle
				yield* Effect.sleep("200 millis");

				const stream = yield* bundleManagerInstance.listenTo("bundleChanged");

				const fiber = yield* Effect.fork(
					stream.pipe(
						Stream.filter((e) => e.bundle.name === "change-panel"),
						Stream.take(1),
						Stream.runCollect,
						Effect.map(Chunk.head),
					),
				);

				yield* Effect.sleep("100 millis");

				// Modify the panel file
				let panel = fs.readFileSync(panelPath, "utf8");
				panel += "\n";
				fs.writeFileSync(panelPath, panel);

				return yield* Fiber.join(fiber).pipe(Effect.timeout("10 seconds"));
			}).pipe(Effect.scoped),
		);

		expect(Option.isSome(eventOption)).toBe(true);
		if (Option.isSome(eventOption)) {
			expect(eventOption.value.bundle.name).toBe("change-panel");
		}
	});

	if (os.platform() !== "win32") {
		test("watcher - should detect panel HTML file changes when the bundle is symlinked", async () => {
			const panelPath = `${tmpDir}/bundles/change-panel-symlink/dashboard/panel.html`;

			const eventOption = await Effect.runPromise(
				Effect.gen(function* () {
					// Wait for any pending events from previous tests to settle
					yield* Effect.sleep("200 millis");

					const stream = yield* bundleManagerInstance.listenTo("bundleChanged");

					const fiber = yield* Effect.fork(
						stream.pipe(
							Stream.filter((e) => e.bundle.name === "change-panel-symlink"),
							Stream.take(1),
							Stream.runCollect,
							Effect.map(Chunk.head),
						),
					);

					yield* Effect.sleep("100 millis");

					// Modify the panel file
					let panel = fs.readFileSync(panelPath, "utf8");
					panel += "\n";
					fs.writeFileSync(panelPath, panel);

					return yield* Fiber.join(fiber).pipe(Effect.timeout("10 seconds"));
				}).pipe(Effect.scoped),
			);

			expect(Option.isSome(eventOption)).toBe(true);
			if (Option.isSome(eventOption)) {
				expect(eventOption.value.bundle.name).toBe("change-panel-symlink");
			}
		});
	}

	test("watcher - should reload the bundle's config when the bundle is reloaded due to a change", async () => {
		const manifest = JSON.parse(
			fs.readFileSync(`${tmpDir}/bundles/change-config/package.json`, "utf8"),
		);
		const bundleConfig = JSON.parse(
			fs.readFileSync(`${tmpDir}/cfg/change-config.json`, "utf8"),
		);

		const eventOption = await Effect.runPromise(
			Effect.gen(function* () {
				// Wait for any pending events from previous tests to settle
				yield* Effect.sleep("200 millis");

				const stream = yield* bundleManagerInstance.listenTo("bundleChanged");

				const fiber = yield* Effect.fork(
					stream.pipe(
						Stream.filter((e) => e.bundle.name === "change-config"),
						Stream.take(1),
						Stream.runCollect,
						Effect.map(Chunk.head),
					),
				);

				yield* Effect.sleep("100 millis");

				// Modify both files
				bundleConfig._changed = true;
				manifest._changed = true;
				fs.writeFileSync(
					`${tmpDir}/bundles/change-config/package.json`,
					JSON.stringify(manifest),
				);
				fs.writeFileSync(
					`${tmpDir}/cfg/change-config.json`,
					JSON.stringify(bundleConfig),
				);

				return yield* Fiber.join(fiber).pipe(Effect.timeout("10 seconds"));
			}).pipe(Effect.scoped),
		);

		expect(Option.isSome(eventOption)).toBe(true);
		if (Option.isSome(eventOption)) {
			expect(eventOption.value.bundle.name).toBe("change-config");
			expect(eventOption.value.bundle.config).toEqual({
				bundleConfig: true,
				_changed: true,
			});
		}
	});

	test("watcher - should emit an `invalidBundle` error when a panel HTML file is removed", async () => {
		const panelPath = `${tmpDir}/bundles/remove-panel/dashboard/panel.html`;

		const eventOption = await Effect.runPromise(
			Effect.gen(function* () {
				// Wait for any pending events from previous tests to settle
				yield* Effect.sleep("200 millis");

				const stream = yield* bundleManagerInstance.listenTo("invalidBundle");

				const fiber = yield* Effect.fork(
					stream.pipe(
						Stream.filter((e) => e.bundle.name === "remove-panel"),
						Stream.take(1),
						Stream.runCollect,
						Effect.map(Chunk.head),
					),
				);

				yield* Effect.sleep("100 millis");

				// Remove the panel file
				fs.unlinkSync(panelPath);

				return yield* Fiber.join(fiber).pipe(Effect.timeout("10 seconds"));
			}).pipe(Effect.scoped),
		);

		expect(Option.isSome(eventOption)).toBe(true);
		if (Option.isSome(eventOption)) {
			expect(eventOption.value.bundle.name).toBe("remove-panel");
			expect(eventOption.value.error.message).toBe(
				'Panel file "panel.html" in bundle "remove-panel" does not exist.',
			);
		}
	});
});
