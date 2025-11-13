import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Command } from "commander";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockProgram, MockCommand } from "../../test/mocks/program.js";
import { setupTmpDir } from "../../test/tmp-dir.js";
import { defaultconfigCommand } from "./defaultconfig.js";

const dirname = path.dirname(fileURLToPath(import.meta.url));

let program: MockCommand;

beforeEach(() => {
	// Set up environment.
	const tempFolder = setupTmpDir();
	process.env["NODECG_ROOT"] = tempFolder;
	process.chdir(tempFolder);
	fs.writeFileSync("package.json", JSON.stringify({ name: "nodecg" }));

	// Copy fixtures.
	fs.cpSync(path.resolve(dirname, "../../test/fixtures/"), "./", {
		recursive: true,
	});

	// Build program.
	program = createMockProgram();
	defaultconfigCommand(program as unknown as Command);
});

describe("when run with a bundle argument", () => {
	it("should successfully create a bundle config file when bundle has configschema.json", async () => {
		await program.runWith("defaultconfig config-schema");
		const config = JSON.parse(
			fs.readFileSync("./cfg/config-schema.json", { encoding: "utf8" }),
		);
		expect(config.username).toBe("user");
		expect(config.value).toBe(5);
		expect(config.nodefault).toBeUndefined();
	});

	it("should print an error when the target bundle does not have a configschema.json", async () => {
		const spy = vi.spyOn(console, "error");
		fs.mkdirSync(
			path.resolve(process.cwd(), "./bundles/missing-schema-bundle"),
			{ recursive: true },
		);
		fs.writeFileSync(
			"./bundles/missing-schema-bundle/package.json",
			JSON.stringify({
				name: "missing-schema-bundle",
				nodecg: { compatibleRange: "^2.0.0" },
			}),
		);
		await program.runWith("defaultconfig missing-schema-bundle");
		expect(spy.mock.calls[0]).toMatchInlineSnapshot(
			`
			[
			  "Error: Bundle missing-schema-bundle does not have a configschema.json",
			]
		`,
		);
		spy.mockRestore();
	});

	it("should print an error when the target bundle does not exist", async () => {
		const spy = vi.spyOn(console, "error");
		await program.runWith("defaultconfig not-installed");
		expect(spy.mock.calls[0]).toMatchInlineSnapshot(
			`
			[
			  "Error: Bundle not-installed does not exist",
			]
		`,
		);
		spy.mockRestore();
	});

	it("should print an error when the target bundle already has a config", async () => {
		const spy = vi.spyOn(console, "error");
		fs.mkdirSync("./cfg");
		fs.writeFileSync(
			"./cfg/config-schema.json",
			JSON.stringify({ fake: "data" }),
		);
		await program.runWith("defaultconfig config-schema");
		expect(spy.mock.calls[0]).toMatchInlineSnapshot(
			`
			[
			  "Error: Bundle config-schema already has a config file",
			]
		`,
		);
		spy.mockRestore();
	});
});

describe("when run with no arguments", () => {
	it("should successfully create a bundle config file when run from inside bundle directory", async () => {
		process.chdir("./bundles/config-schema");
		await program.runWith("defaultconfig");
		expect(fs.existsSync("../../cfg/config-schema.json")).toBe(true);
	});

	it("should print an error when in a folder with no package.json", async () => {
		fs.mkdirSync(path.resolve(process.cwd(), "./bundles/not-a-bundle"), {
			recursive: true,
		});
		process.chdir("./bundles/not-a-bundle");

		const spy = vi.spyOn(console, "error");
		await program.runWith("defaultconfig");
		expect(spy.mock.calls[0]).toMatchInlineSnapshot(
			`
			[
			  "Error: No bundle found in the current directory!",
			]
		`,
		);
		spy.mockRestore();
	});
});

describe("installed mode (NodeCG as dependency)", () => {
	beforeEach(() => {
		// Set up installed mode environment.
		const tempFolder = setupTmpDir();
		process.env["NODECG_ROOT"] = tempFolder;
		process.chdir(tempFolder);

		// Root is a bundle project with nodecg field
		fs.writeFileSync(
			"package.json",
			JSON.stringify({
				name: "my-awesome-bundle",
				nodecg: { compatibleRange: "^2.0.0" },
			}),
		);

		// Create configschema.json in root
		fs.writeFileSync(
			"configschema.json",
			JSON.stringify({
				type: "object",
				properties: {
					installedMode: { type: "boolean", default: true },
					value: { type: "number", default: 42 },
				},
			}),
		);

		// Build program.
		program = createMockProgram();
		defaultconfigCommand(program as unknown as Command);
	});

	it("should create config for root bundle when bundle name matches root package", async () => {
		await program.runWith("defaultconfig my-awesome-bundle");
		const config = JSON.parse(
			fs.readFileSync("./cfg/my-awesome-bundle.json", { encoding: "utf8" }),
		);
		expect(config.installedMode).toBe(true);
		expect(config.value).toBe(42);
	});

	it("should create config for root bundle when run with no arguments", async () => {
		await program.runWith("defaultconfig");
		expect(fs.existsSync("./cfg/my-awesome-bundle.json")).toBe(true);
		const config = JSON.parse(
			fs.readFileSync("./cfg/my-awesome-bundle.json", { encoding: "utf8" }),
		);
		expect(config.installedMode).toBe(true);
	});

	it("should still check bundles directory when bundle name doesn't match root", async () => {
		// Create a bundle in bundles directory
		fs.mkdirSync("./bundles/another-bundle", { recursive: true });
		fs.writeFileSync(
			"./bundles/another-bundle/package.json",
			JSON.stringify({
				name: "another-bundle",
				nodecg: { compatibleRange: "^2.0.0" },
			}),
		);
		fs.writeFileSync(
			"./bundles/another-bundle/configschema.json",
			JSON.stringify({
				type: "object",
				properties: {
					fromBundlesDir: { type: "boolean", default: true },
				},
			}),
		);

		await program.runWith("defaultconfig another-bundle");
		const config = JSON.parse(
			fs.readFileSync("./cfg/another-bundle.json", { encoding: "utf8" }),
		);
		expect(config.fromBundlesDir).toBe(true);
	});
});
