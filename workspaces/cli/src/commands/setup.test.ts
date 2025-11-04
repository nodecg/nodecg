import "../../test/mocks/nano-spawn-mock.js";

import fs from "node:fs";

import { Command } from "commander";
import type { PackageJson } from "type-fest";
import { beforeEach, expect, test, vi } from "vitest";

import { createMockProgram, MockCommand } from "../../test/mocks/program.js";
import { setupTmpDir } from "../../test/tmp-dir.js";
import { setupCommand } from "./setup.js";

vi.mock("@inquirer/prompts", () => ({ confirm: () => Promise.resolve(true) }));

vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
	const urlString =
		typeof url === "string" ? url : url instanceof URL ? url.href : url.url;

	// Mock npm registry version list
	if (
		/registry\.npmjs\.org\/nodecg$/.exec(urlString) ||
		/registry\.npmjs\.org\/nodecg\?/.exec(urlString)
	) {
		return new Response(
			JSON.stringify({
				versions: {
					"1.9.0": {},
					"2.0.0": {},
					"2.1.0": {},
					"2.6.1": {},
				},
			}),
		);
	}

	// Mock package metadata
	if (/registry\.npmjs\.org\/nodecg\/\d/.exec(urlString)) {
		const version = /nodecg\/([\d.]+)/.exec(urlString)?.[1];
		return new Response(
			JSON.stringify({
				dist: {
					tarball: `https://mock-registry.test/nodecg/-/nodecg-${version}.tgz`,
				},
			}),
		);
	}

	// Mock tarball download
	if (urlString.includes("mock-registry.test")) {
		const version = /nodecg-([\d.]+)\.tgz/.exec(urlString)?.[1] ?? "2.0.0";

		// Create minimal gzipped tar archive with package/package.json
		const tar = await import("tar");
		const fs = await import("node:fs");
		const path = await import("node:path");
		const os = await import("node:os");
		const { pipeline } = await import("node:stream");
		const { promisify } = await import("node:util");

		const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "nodecg-test-tar-"));
		const packageDir = path.join(tmpDir, "package");
		fs.mkdirSync(packageDir, { recursive: true });

		const packageJson = { name: "nodecg", version };
		fs.writeFileSync(
			path.join(packageDir, "package.json"),
			JSON.stringify(packageJson, null, 2),
		);

		// Create gzipped tar using tar.c (create) with file output
		const tarPath = path.join(tmpDir, "archive.tgz");
		const writeStream = fs.createWriteStream(tarPath);
		const tarStream = tar.create({ cwd: tmpDir, gzip: true }, ["package"]);

		await promisify(pipeline)(tarStream, writeStream);

		// Read the entire tar file into memory before deleting temp dir
		const tarBuffer = fs.readFileSync(tarPath);
		fs.rmSync(tmpDir, { recursive: true });

		// Create a Node.js Readable stream from the buffer
		const { Readable } = await import("node:stream");
		const nodeStream = Readable.from(tarBuffer);

		// Return a Response-like object with the Node stream as body
		// NOTE: Node.js stream.pipeline() works with this mock approach
		return {
			ok: true,
			status: 200,
			headers: new Headers({ "Content-Type": "application/gzip" }),
			body: nodeStream,
		} as unknown as Response;
	}

	throw new Error(`Unmocked fetch call: ${urlString}`);
});

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

test("should install the latest NodeCG when no version is specified", async () => {
	chdir();
	await program.runWith("setup --skip-dependencies");
	expect(readPackageJson().name).toBe("nodecg");
});

test("should install v2 NodeCG when specified", async () => {
	chdir();
	await program.runWith("setup 2.0.0 --skip-dependencies");
	expect(readPackageJson().name).toBe("nodecg");
	expect(readPackageJson().version).toBe("2.0.0");

	await program.runWith("setup 2.1.0 -u --skip-dependencies");
	expect(readPackageJson().version).toBe("2.1.0");

	await program.runWith("setup 2.0.0 -u --skip-dependencies");
	expect(readPackageJson().version).toBe("2.0.0");
});

test("install NodeCG with dependencies", async () => {
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
