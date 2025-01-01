import fs from "node:fs";

import { Command } from "commander";
import semver from "semver";
import { beforeEach, expect, it, vi } from "vitest";

import { createMockProgram, MockCommand } from "../test/mocks/program.js";
import { setupTmpDir } from "../test/tmp-dir.js";
import { installCommand } from "./install.js";

let program: MockCommand;
const tempFolder = setupTmpDir();
process.chdir(tempFolder);
fs.writeFileSync("package.json", JSON.stringify({ name: "nodecg" }));

beforeEach(() => {
	program = createMockProgram();
	installCommand(program as unknown as Command);
});

it("should install a bundle and its dependencies", async () => {
	await program.runWith("install supportclass/lfg-streamtip");
	expect(fs.existsSync("./bundles/lfg-streamtip/package.json")).toBe(true);
	expect(
		fs.readdirSync("./bundles/lfg-streamtip/node_modules").length,
	).toBeGreaterThan(0);
	expect(
		fs.readdirSync("./bundles/lfg-streamtip/bower_components").length,
	).toBeGreaterThan(0);
});

it("should install a version that satisfies a provided semver range", async () => {
	await program.runWith("install supportclass/lfg-nucleus#^1.1.0");
	expect(fs.existsSync("./bundles/lfg-nucleus/package.json")).toBe(true);

	const pjson = JSON.parse(
		fs.readFileSync("./bundles/lfg-nucleus/package.json", {
			encoding: "utf8",
		}),
	);
	expect(semver.satisfies(pjson.version, "^1.1.0")).toBe(true);
});

it("should install bower & npm dependencies when run with no arguments in a bundle directory", async () => {
	fs.rmSync("./bundles/lfg-streamtip/node_modules", {
		recursive: true,
		force: true,
	});
	fs.rmSync("./bundles/lfg-streamtip/bower_components", {
		recursive: true,
		force: true,
	});

	process.chdir("./bundles/lfg-streamtip");
	await program.runWith("install");
	expect(fs.readdirSync("./node_modules").length).toBeGreaterThan(0);
	expect(fs.readdirSync("./bower_components").length).toBeGreaterThan(0);
});

it("should print an error when no valid git repo is provided", async () => {
	const spy = vi.spyOn(console, "error");
	await program.runWith("install 123");
	expect(spy).toBeCalledWith(
		"Please enter a valid git repository URL or GitHub username/repo pair.",
	);
	spy.mockRestore();
});
