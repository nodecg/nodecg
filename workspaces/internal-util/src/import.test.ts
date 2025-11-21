import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

let tempDir: string;
let originalCwd: string;

describe("import from directories without package.json", () => {
	beforeEach(() => {
		// Save original working directory
		originalCwd = process.cwd();

		// Create a temporary directory without package.json
		tempDir = mkdtempSync(path.join(tmpdir(), "nodecg-internal-util-test-"));

		// Change to the temp directory before importing
		process.chdir(tempDir);
	});

	afterEach(() => {
		// Restore original working directory
		process.chdir(originalCwd);

		// Clean up temp directory
		rmSync(tempDir, { recursive: true, force: true });
	});

	test("internal-util can be imported without throwing errors", async () => {
		// This import should NOT throw "Could not find Node.js project" error
		// The module should use lazy evaluation and only execute filesystem
		// operations when functions are actually called, not on import
		const importPromise = import("./main.js");

		// The import itself should succeed without errors
		await expect(importPromise).resolves.toBeDefined();

		const module = await importPromise;

		// Verify exports are available
		expect(module.rootPaths).toBeDefined();
		expect(module.isLegacyProject).toBeDefined();

		// These are functions that should only execute when called
		expect(typeof module.isLegacyProject).toBe("function");
	});

	test("isLegacyProject throws error only when called, not on import", async () => {
		// Import should succeed
		const { isLegacyProject } = await import("./main.js");

		// Calling the function should throw because there's no package.json
		expect(() => isLegacyProject()).toThrow("Could not find Node.js project");
	});

	test("rootPaths getters throw error only when accessed, not on import", async () => {
		// Import should succeed
		const { rootPaths } = await import("./main.js");

		// Accessing the getters should throw because there's no package.json
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
		// Save original working directory
		originalCwd = process.cwd();

		// Create a temporary directory WITH package.json
		tempDir = mkdtempSync(
			path.join(tmpdir(), "nodecg-internal-util-valid-test-"),
		);

		// Create a valid package.json
		writeFileSync(
			path.join(tempDir, "package.json"),
			JSON.stringify({
				name: "test-project",
				version: "1.0.0",
				nodecgRoot: true,
			}),
			"utf-8",
		);

		// Change to the temp directory
		process.chdir(tempDir);
	});

	afterEach(() => {
		// Restore original working directory
		process.chdir(originalCwd);

		// Clean up temp directory
		rmSync(tempDir, { recursive: true, force: true });
	});

	test("internal-util works correctly when package.json exists", async () => {
		// Import should succeed
		const { isLegacyProject, rootPaths } = await import("./main.js");

		// Should work correctly
		expect(isLegacyProject()).toBe(true);
		expect(rootPaths.runtimeRootPath).toBe(tempDir);
	});
});
