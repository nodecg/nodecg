import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { NodeContext, NodeFileSystem, NodePath } from "@effect/platform-node";
import { afterEach, beforeEach, expect, layer } from "@effect/vitest";
import { Effect, Layer } from "effect";

import { getRuntimeRoot } from "./root-paths.ts";

layer(Layer.mergeAll(NodeContext.layer, NodeFileSystem.layer, NodePath.layer))(
	"computeRootPaths",
	(it) => {
		let tempDir: string;
		let legacyProjectDir: string;
		let installedProjectDir: string;

		beforeEach(() => {
			tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "internal-util-test-"));

			legacyProjectDir = path.join(tempDir, "legacy");
			fs.mkdirSync(legacyProjectDir);
			fs.writeFileSync(
				path.join(legacyProjectDir, "package.json"),
				JSON.stringify({ nodecgRoot: true }),
			);

			installedProjectDir = path.join(tempDir, "installed");
			fs.mkdirSync(installedProjectDir);
			fs.writeFileSync(
				path.join(installedProjectDir, "package.json"),
				JSON.stringify({ name: "test" }),
			);
		});

		afterEach(() => {
			if (tempDir && fs.existsSync(tempDir)) {
				fs.rmSync(tempDir, { recursive: true });
			}
		});

		it.effect(
			"computes paths for legacy project",
			Effect.fn(function* () {
				const result = yield* computeRootPaths(legacyProjectDir);

				expect(result.runtimeRootPath).toBe(legacyProjectDir);
				expect(result.nodecgInstalledPath).toBe(
					path.join(legacyProjectDir, "workspaces/nodecg"),
				);
			}),
		);

		it.effect(
			"computes paths for installed project",
			Effect.fn(function* () {
				const result = yield* computeRootPaths(installedProjectDir);

				expect(result.runtimeRootPath).toBe(installedProjectDir);
				expect(result.nodecgInstalledPath).toBe(
					path.join(installedProjectDir, "node_modules/nodecg"),
				);
			}),
		);
	},
);

layer(Layer.mergeAll(NodeContext.layer, NodeFileSystem.layer, NodePath.layer))(
	"getRuntimeRoot",
	(it) => {
		let originalEnv: string | undefined;

		beforeEach(() => {
			originalEnv = process.env["NODECG_ROOT"];
			delete process.env["NODECG_ROOT"];
		});

		afterEach(() => {
			if (originalEnv !== undefined) {
				process.env["NODECG_ROOT"] = originalEnv;
			} else {
				delete process.env["NODECG_ROOT"];
			}
		});

		it.effect(
			"returns NODECG_ROOT env var when set",
			Effect.fn(function* () {
				process.env["NODECG_ROOT"] = "/custom/root";

				const result = yield* getRuntimeRoot;

				expect(result).toBe("/custom/root");
			}),
		);

		it.effect(
			"returns computed root path when NODECG_ROOT is not set",
			Effect.fn(function* () {
				delete process.env["NODECG_ROOT"];

				const result = yield* getRuntimeRoot;

				expect(result).toBeDefined();
				expect(typeof result).toBe("string");
			}),
		);
	},
);
