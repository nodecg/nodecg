import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

let tempDir: string;
let originalCwd: string;

beforeEach(() => {
	// Save original working directory
	originalCwd = process.cwd();

	// Create a temporary directory without package.json
	tempDir = mkdtempSync(path.join(tmpdir(), "nodecg-cli-import-test-"));

	// Change to the temp directory before importing
	process.chdir(tempDir);
});

afterEach(() => {
	// Restore original working directory
	process.chdir(originalCwd);

	// Clean up temp directory
	rmSync(tempDir, { recursive: true, force: true });
});

test("CLI modules can be imported from directories without package.json", async () => {
	// This import should NOT throw "Could not find Node.js project" error
	// because the module should use lazy evaluation, not module-level side effects
	const { setupCLI } = await import("./index.js");

	// Verify the import succeeded
	expect(setupCLI).toBeDefined();
	expect(typeof setupCLI).toBe("function");
});

test("CLI commands can be imported from directories without package.json", async () => {
	// Import all command modules - none should trigger recursion at import time
	const { setupCommands } = await import("./commands/index.js");

	// Verify the import succeeded
	expect(setupCommands).toBeDefined();
	expect(typeof setupCommands).toBe("function");
});
