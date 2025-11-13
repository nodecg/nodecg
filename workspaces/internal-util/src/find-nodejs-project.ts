import fs from "node:fs";

import path from "path";

export function recursivelyFindNodeJSProject(dir: string) {
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

export const nearestProjectDirFromCwd = recursivelyFindNodeJSProject(
	process.cwd(),
);
