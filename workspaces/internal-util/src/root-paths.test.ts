import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

let tempDir: string;
let originalCwd: string;

function writePackageJson(contents: object) {
	writeFileSync(
		path.join(tempDir, "package.json"),
		JSON.stringify(contents),
		"utf-8",
	);
}

describe("nodecgInstalledPath per project layout", () => {
	beforeEach(() => {
		originalCwd = process.cwd();
		tempDir = mkdtempSync(path.join(tmpdir(), "nodecg-root-paths-test-"));
		process.chdir(tempDir);
		vi.resetModules();
	});

	afterEach(() => {
		process.chdir(originalCwd);
		rmSync(tempDir, { recursive: true, force: true });
	});

	test("standalone install (name 'nodecg') resolves to the runtime root", async () => {
		writePackageJson({ name: "nodecg", version: "2.6.4" });

		const { rootPaths, getProjectType } = await import("./main.js");

		expect(getProjectType()).toBe("standalone");
		expect(rootPaths.nodecgInstalledPath).toBe(rootPaths.runtimeRootPath);
	});

	test("monorepo root (nodecgRoot true) resolves to workspaces/nodecg", async () => {
		writePackageJson({ name: "nodecg-monorepo", nodecgRoot: true });

		const { rootPaths, getProjectType } = await import("./main.js");

		expect(getProjectType()).toBe("monorepo");
		expect(rootPaths.nodecgInstalledPath).toBe(
			path.join(rootPaths.runtimeRootPath, "workspaces/nodecg"),
		);
	});

	test("dependency install resolves to node_modules/nodecg", async () => {
		writePackageJson({ name: "my-nodecg-project", version: "1.0.0" });

		const { rootPaths, getProjectType } = await import("./main.js");

		expect(getProjectType()).toBe("dependency");
		expect(rootPaths.nodecgInstalledPath).toBe(
			path.join(rootPaths.runtimeRootPath, "node_modules/nodecg"),
		);
	});
});
