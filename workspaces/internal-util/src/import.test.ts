import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

let tempDir: string;
let originalCwd: string;

describe("import from directories without package.json", () => {
	beforeEach(() => {
		originalCwd = process.cwd();
		tempDir = mkdtempSync(path.join(tmpdir(), "nodecg-internal-util-test-"));
		process.chdir(tempDir);
	});

	afterEach(() => {
		process.chdir(originalCwd);
		rmSync(tempDir, { recursive: true, force: true });
	});

	test("internal-util can be imported without throwing errors", async () => {
		const importPromise = import("./main.js");
		await expect(importPromise).resolves.toBeDefined();

		const module = await importPromise;
		expect(module.rootPaths).toBeDefined();
		expect(module.isLegacyProject).toBeDefined();

		expect(typeof module.isLegacyProject).toBe("function");
	});

	test("isLegacyProject throws error only when called, not on import", async () => {
		const { isLegacyProject } = await import("./main.js");

		expect(() => isLegacyProject()).toThrow("Could not find Node.js project");
	});

	test("rootPaths getters throw error only when accessed, not on import", async () => {
		const { rootPaths } = await import("./main.js");

		expect(() => rootPaths.runtimeRootPath).toThrow(
			"Could not find Node.js project",
		);
		expect(() => rootPaths.nodecgInstalledPath).toThrow(
			"Could not find Node.js project",
		);
	});
});

describe("import from directories with package.json", () => {
	beforeEach(() => {
		originalCwd = process.cwd();
		tempDir = mkdtempSync(
			path.join(tmpdir(), "nodecg-internal-util-valid-test-"),
		);

		writeFileSync(
			path.join(tempDir, "package.json"),
			JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				nodecgRoot: true,
			}),
			"utf-8",
		);

		process.chdir(tempDir);
	});

	afterEach(() => {
		process.chdir(originalCwd);
		rmSync(tempDir, { recursive: true, force: true });
	});

	test("internal-util works correctly when package.json exists", async () => {
		const { isLegacyProject, rootPaths } = await import("./main.js");

		expect(isLegacyProject()).toBe(true);
		expect(rootPaths.runtimeRootPath).toBe(tempDir);
	});
});
