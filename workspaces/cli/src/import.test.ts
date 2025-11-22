import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, expect, test } from "vitest";

let tempDir: string;
let originalCwd: string;

beforeEach(() => {
	originalCwd = process.cwd();
	tempDir = mkdtempSync(path.join(tmpdir(), "nodecg-cli-import-test-"));
	process.chdir(tempDir);
});

afterEach(() => {
	process.chdir(originalCwd);
	rmSync(tempDir, { recursive: true, force: true });
});

test("CLI modules can be imported from directories without package.json", async () => {
	const { setupCLI } = await import("./index.js");

	expect(setupCLI).toBeDefined();
	expect(typeof setupCLI).toBe("function");
});

test("CLI commands can be imported from directories without package.json", async () => {
	const { setupCommands } = await import("./commands/index.js");

	expect(setupCommands).toBeDefined();
	expect(typeof setupCommands).toBe("function");
});
