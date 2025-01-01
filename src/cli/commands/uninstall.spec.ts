import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";
import { beforeEach, expect, it, vi } from "vitest";

import { createMockProgram, MockCommand } from "../test/mocks/program.js";
import { setupTmpDir } from "../test/tmp-dir.js";
import { uninstallCommand } from "./uninstall.js";

vi.mock("@inquirer/prompts", () => ({ confirm: () => Promise.resolve(true) }));

const dirname = path.dirname(fileURLToPath(import.meta.url));

let program: MockCommand;

beforeEach(() => {
	// Set up environment.
	const tempFolder = setupTmpDir();
	process.chdir(tempFolder);
	fs.writeFileSync("package.json", JSON.stringify({ name: "nodecg" }));

	// Copy fixtures.
	fs.cpSync(path.resolve(__dirname, "../test/fixtures/"), "./", { recursive: true });

	// Build program.
	program = createMockProgram();
	uninstallCommand(program as unknown as Command);
});

it("should delete the bundle's folder after prompting for confirmation", async () => {
	await program.runWith("uninstall uninstall-test");
	expect(fs.existsSync("./bundles/uninstall-test")).toBe(false);
});

it("should print an error when the target bundle is not installed", async () => {
	const spy = vi.spyOn(console, "error");
	await program.runWith("uninstall not-installed");
	expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
		[
		  "Cannot uninstall not-installed: bundle is not installed.",
		]
	`);
	spy.mockRestore();
});
