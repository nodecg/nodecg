import fs from "node:fs";
import path from "node:path";

/**
 * @deprecated Use findNodeJsProject from the main export instead
 */
export function recursivelyFindNodeJSProject(dir: string): string {
	const packageJsonPath = path.join(dir, "package.json");
	if (fs.existsSync(packageJsonPath)) {
		return dir;
	}

	const parentDir = path.dirname(dir);
	if (dir === parentDir) {
		throw new Error("Could not find Node.js project");
	}

	return recursivelyFindNodeJSProject(parentDir);
}

/**
 * @deprecated Use findNodeJsProject(process.cwd()) from the main export instead
 */
export const nearestProjectDirFromCwd = recursivelyFindNodeJSProject(
	process.cwd(),
);

/**
 * @deprecated Use detectProjectType from the main export instead
 */
export const isLegacyProject = (() => {
	const packageJsonPath = path.join(nearestProjectDirFromCwd, "package.json");
	const packageJsonContent = fs.readFileSync(packageJsonPath, "utf-8");
	const packageJson = JSON.parse(packageJsonContent) as {
		nodecgRoot?: boolean;
	};

	const isLegacy = packageJson.nodecgRoot === true;

	if (!isLegacy) {
		console.warn(
			"NodeCG is installed as a dependency. This is an experimental feature. Please report any issues you encounter.",
		);
	}

	return isLegacy;
})();

/**
 * @deprecated Use computeRootPaths from the main export instead
 */
export const rootPaths = (() => {
	const runtimeRootPath = nearestProjectDirFromCwd;

	const nodecgInstalledPath = isLegacyProject
		? path.join(runtimeRootPath, "workspaces/nodecg")
		: path.join(runtimeRootPath, "node_modules/nodecg");

	return {
		runtimeRootPath,
		nodecgInstalledPath,
		getRuntimeRoot: () => {
			const { NODECG_ROOT } = process.env;
			if (NODECG_ROOT) {
				return NODECG_ROOT;
			}
			return runtimeRootPath;
		},
	};
})();
