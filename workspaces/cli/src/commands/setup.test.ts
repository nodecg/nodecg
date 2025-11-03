import fs from "node:fs";

import { Command } from "commander";
import type { PackageJson } from "type-fest";
import { beforeEach, expect, test, vi } from "vitest";

import { createMockProgram, MockCommand } from "../../test/mocks/program.js";
import { setupTmpDir } from "../../test/tmp-dir.js";
import { setupCommand } from "./setup.js";

vi.mock("@inquirer/prompts", () => ({ confirm: () => Promise.resolve(true) }));

let program: MockCommand;
let currentDir = setupTmpDir();
const chdir = (keepCurrentDir = false) => {
	if (!keepCurrentDir) {
		currentDir = setupTmpDir();
	}

	process.chdir(currentDir);
};

const readPackageJson = (): PackageJson => {
	return JSON.parse(fs.readFileSync("./package.json", { encoding: "utf8" }));
};

beforeEach(() => {
	chdir(true);
	program = createMockProgram();
	setupCommand(program as unknown as Command);
});

test(
	"should install the latest NodeCG when no version is specified",
	{ timeout: 30_000 },
	async () => {
		chdir();
		await program.runWith("setup --skip-dependencies");
		expect(readPackageJson().name).toBe("nodecg");
	},
);

test(
	"should install v2 NodeCG when specified",
	{ timeout: 30_000 },
	async () => {
		chdir();
		await program.runWith("setup 2.0.0 --skip-dependencies");
		expect(readPackageJson().name).toBe("nodecg");
		expect(readPackageJson().version).toBe("2.0.0");

		await program.runWith("setup 2.1.0 -u --skip-dependencies");
		expect(readPackageJson().version).toBe("2.1.0");

		await program.runWith("setup 2.0.0 -u --skip-dependencies");
		expect(readPackageJson().version).toBe("2.0.0");
	},
);

test("install NodeCG with dependencies", { timeout: 600_000 }, async () => {
	chdir();
	await program.runWith("setup 2.6.1");
	expect(readPackageJson().name).toBe("nodecg");
	expect(readPackageJson().version).toBe("2.6.1");
	expect(fs.readdirSync(".")).toContain("node_modules");
});

test("should throw when trying to install v1 NodeCG", async () => {
	chdir();
	const spy = vi.spyOn(console, "error");
	await program.runWith("setup 1.9.0 -u --skip-dependencies");
	expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
		[
		  "CLI does not support NodeCG versions older than v2.0.0.",
		]
	`);
	spy.mockRestore();
});

test("should print an error when the target version is the same as current", async () => {
	chdir();
	const spy = vi.spyOn(console, "log");
	await program.runWith("setup 2.1.0 --skip-dependencies");
	await program.runWith("setup 2.1.0 -u --skip-dependencies");
	expect(spy.mock.calls[1]).toMatchInlineSnapshot(`
		[
		  "The target version (2.1.0) is equal to the current version (2.1.0). No action will be taken.",
		]
	`);
	spy.mockRestore();
});

test("should print an error when the target version doesn't exist", async () => {
	chdir();
	const spy = vi.spyOn(console, "error");
	await program.runWith("setup 999.999.999 --skip-dependencies");
	expect(spy.mock.calls[0]).toMatchInlineSnapshot(`
		[
		  "No releases match the supplied semver range (999.999.999)",
		]
	`);
	spy.mockRestore();
});

test("should print an error and exit, when nodecg is already installed in the current directory ", async () => {
	chdir();
	const spy = vi.spyOn(console, "error");
	await program.runWith("setup 2.0.0 --skip-dependencies");
	await program.runWith("setup 2.0.0 --skip-dependencies");
	expect(spy).toBeCalledWith("NodeCG is already installed in this directory.");
	spy.mockRestore();
});
