import path from "node:path";

import { getNearestProjectDirFromCwd } from "./find-nodejs-project.ts";
import { getProjectType } from "./project-type.ts";

let _cachedRuntimeRootPath: string | undefined;

function getRuntimeRootPath(): string {
	if (_cachedRuntimeRootPath === undefined) {
		_cachedRuntimeRootPath = getNearestProjectDirFromCwd();
	}
	return _cachedRuntimeRootPath;
}

let _cachedNodecgInstalledPath: string | undefined;

function getNodecgInstalledPath(): string {
	if (_cachedNodecgInstalledPath === undefined) {
		const runtimeRoot = getRuntimeRootPath();
		switch (getProjectType()) {
			case "monorepo":
				_cachedNodecgInstalledPath = path.join(
					runtimeRoot,
					"workspaces/nodecg",
				);
				break;
			case "standalone":
				_cachedNodecgInstalledPath = runtimeRoot;
				break;
			case "dependency":
				_cachedNodecgInstalledPath = path.join(
					runtimeRoot,
					"node_modules/nodecg",
				);
				break;
		}
	}
	return _cachedNodecgInstalledPath;
}

export const rootPaths = {
	get runtimeRootPath() {
		return getRuntimeRootPath();
	},
	get nodecgInstalledPath() {
		return getNodecgInstalledPath();
	},
	/**
	 * Allow overriding the runtime root path via environment variable mainly for tests
	 */
	getRuntimeRoot: () => {
		const { NODECG_ROOT } = process.env;
		if (NODECG_ROOT) {
			return NODECG_ROOT;
		}
		return getRuntimeRootPath();
	},
};
