import fs from "node:fs";
import path from "node:path";

/**
 * The root path of the NodeCG runtime. It is either bundle project root (modern) or the NodeCG root (legacy).
 */
export const rootPath = recursivelyFindNodeJSProject(process.cwd());

/**
 * Mainly for tests to override the NodeCG root path.
 */
export function getNodecgRoot() {
	return process.env["NODECG_ROOT"] ?? rootPath;
}

function recursivelyFindNodeJSProject(dir: string) {
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
