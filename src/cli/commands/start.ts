import path from "node:path";

import { Command } from "commander";

import { pathContainsNodeCG } from "../lib/util.js";

export function startCommand(program: Command) {
	program
		.command("start")
		.option("-d, --disable-source-maps", "Disable source map support")
		.description("Start NodeCG")
		.action(async () => {
			const cwd = process.cwd();

			// Check if nodecg is already installed
			if (pathContainsNodeCG(cwd)) {
				await import(path.join(cwd, "index.js"));
				return;
			}

			// Check if NodeCG is installed as a dependency
			const nodecgDependencyPath = path.join(cwd, "node_modules/nodecg");
			if (pathContainsNodeCG(nodecgDependencyPath)) {
				await import(path.join(nodecgDependencyPath, "index.js"));
			}
		});
}
