import path from "node:path";

import { Command } from "commander";
import spawn from "nano-spawn";

import { pathContainsNodeCG } from "../lib/util.js";

export function startCommand(program: Command) {
	program
		.command("start")
		.option("-d, --disable-source-maps", "Disable source map support")
		.description("Start NodeCG")
		.action(async (options: { disableSourceMaps: boolean }) => {
			const cwd = process.cwd();
			// Check if nodecg is already installed
			if (pathContainsNodeCG(cwd)) {
				if (options.disableSourceMaps) {
					await spawn("node", ["index.js"], { stdio: "inherit" });
				} else {
					await spawn("node", ["--enable-source-maps", "index.js"], {
						stdio: "inherit",
					});
				}
				return;
			}

			// Check if NodeCG is installed as a dependency
			const nodecgDependencyPath = path.join(cwd, "node_modules/nodecg");
			if (pathContainsNodeCG(nodecgDependencyPath)) {
				if (options.disableSourceMaps) {
					await spawn("node", ["node_modules/nodecg/index.js"], {
						stdio: "inherit",
					});
				} else {
					await spawn(
						"node",
						["--enable-source-maps", "node_modules/nodecg/index.js"],
						{ stdio: "inherit" },
					);
				}
				return;
			}
		});
}
