import { Command } from "commander";
import spawn from "nano-spawn";

import { pathContainsNodeCG } from "../lib/util.js";

export function startCommand(program: Command) {
	program
		.command("start")
		.option("-d, --disable-source-maps", "Disable source map support")
		.description("Start NodeCG")
		.action(async (options: { disableSourceMaps: boolean }) => {
			// Check if nodecg is already installed
			if (pathContainsNodeCG(process.cwd())) {
				if (options.disableSourceMaps) {
					await spawn("node", ["index.js"], { stdio: "inherit" });
				} else {
					await spawn("node", ["--enable-source-maps", "index.js"], {
						stdio: "inherit",
					});
				}
			} else {
				console.warn("No NodeCG installation found in this folder.");
			}
		});
}
