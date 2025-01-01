import { execSync } from "node:child_process";

import { Command } from "commander";

import { pathContainsNodeCG } from "../lib/util.js";

export function startCommand(program: Command) {
	program
		.command("start")
		.option("-d, --disable-source-maps", "Disable source map support")
		.description("Start NodeCG")
		.action((options: { disableSourceMaps: boolean }) => {
			// Check if nodecg is already installed
			if (pathContainsNodeCG(process.cwd())) {
				if (options.disableSourceMaps) {
					execSync("node index.js", { stdio: "inherit" });
				} else {
					execSync("node --enable-source-maps index.js", { stdio: "inherit" });
				}
			} else {
				console.warn("No NodeCG installation found in this folder.");
			}
		});
}
