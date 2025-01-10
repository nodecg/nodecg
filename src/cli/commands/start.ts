import fs from "node:fs";
import path from "node:path";

import { Command } from "commander";

import { pathContainsNodeCG } from "../lib/util.js";

export function startCommand(program: Command) {
	program
		.command("start")
		.option("-d, --disable-source-maps", "Disable source map support")
		.description("Start NodeCG")
		.action(async () => {
			const projectDir = recursivelyFindProject(process.cwd());

			// Check if nodecg is already installed
			if (pathContainsNodeCG(projectDir)) {
				await import(path.join(projectDir, "index.js"));
				return;
			}

			// Check if NodeCG is installed as a dependency
			const nodecgDependencyPath = path.join(projectDir, "node_modules/nodecg");
			if (pathContainsNodeCG(nodecgDependencyPath)) {
				await import(path.join(nodecgDependencyPath, "index.js"));
			}
		});
}

function recursivelyFindProject(startDir: string) {
	if (!path.isAbsolute(startDir)) {
		throw new Error("startDir must be an absolute path");
	}
	const packageJsonDir = path.join(startDir, "package.json");
	if (fs.existsSync(packageJsonDir)) {
		return startDir;
	}
	const parentDir = path.dirname(startDir);
	if (parentDir === startDir) {
		throw new Error("Could not find a project directory");
	}
	return recursivelyFindProject(parentDir);
}
