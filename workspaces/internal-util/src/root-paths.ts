import path from "node:path";

import { nearestProjectDirFromCwd } from "./find-nodejs-project";
import { isLegacyProject } from "./project-type";

const runtimeRootPath = nearestProjectDirFromCwd;

const nodecgInstalledPath = isLegacyProject
	? path.join(runtimeRootPath, "workspaces/nodecg")
	: path.join(runtimeRootPath, "node_modules/nodecg");

export const rootPaths = {
	runtimeRootPath,
	nodecgInstalledPath,
	/**
	 * Allow overriding the runtime root path via environment variable mainly for tests
	 */
	getRuntimeRoot: () => {
		const { NODECG_ROOT } = process.env;
		if (NODECG_ROOT) {
			return NODECG_ROOT;
		}
		return runtimeRootPath;
	},
};
