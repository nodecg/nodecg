import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { expect, test } from "vitest";

test("CLI modules can be imported from directories without package.json", async () => {
	// Create a temporary directory without package.json
	const tempDir = mkdtempSync(path.join(tmpdir(), "nodecg-cli-import-test-"));
	const originalCwd = process.cwd();

	try {
		// Change to the temp directory before importing
		process.chdir(tempDir);

		// This import should NOT throw "Could not find Node.js project" error
		// because the module should use lazy evaluation, not module-level side effects
		const { setupCLI } = await import("./index.js");

		// Verify the import succeeded
		expect(setupCLI).toBeDefined();
		expect(typeof setupCLI).toBe("function");
	} finally {
		// Restore original working directory
		process.chdir(originalCwd);

		// Clean up temp directory
		rmSync(tempDir, { recursive: true, force: true });
	}
});

test("CLI commands can be imported from directories without package.json", async () => {
	// Create a temporary directory without package.json
	const tempDir = mkdtempSync(path.join(tmpdir(), "nodecg-cli-commands-test-"));
	const originalCwd = process.cwd();

	try {
		// Change to the temp directory before importing
		process.chdir(tempDir);

		// Import all command modules - none should trigger recursion at import time
		const { setupCommands } = await import("./commands/index.js");

		// Verify the import succeeded
		expect(setupCommands).toBeDefined();
		expect(typeof setupCommands).toBe("function");
	} finally {
		// Restore original working directory
		process.chdir(originalCwd);

		// Clean up temp directory
		rmSync(tempDir, { recursive: true, force: true });
	}
});
