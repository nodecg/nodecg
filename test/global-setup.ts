import { rm } from "node:fs/promises";
import { EOL } from "node:os";
import { join } from "node:path";

import spawn from "nano-spawn";
import type { TestProject } from "vitest/node";

export default async function globalSetup(project: TestProject) {
	await spawn("npm", ["run", "build"]);
	const { stdout } = await spawn("npm", ["pack"]);
	const packagePath = stdout.trim().split(EOL).at(-1);
	if (!packagePath) {
		throw new Error("Failed to get package path");
	}
	const packageFullPath = join(__dirname, "..", packagePath);
	project.provide("packagePath", packageFullPath);

	return async () => {
		await rm(packageFullPath);
	};
}

declare module "vitest" {
	export interface ProvidedContext {
		packagePath: string;
	}
}
