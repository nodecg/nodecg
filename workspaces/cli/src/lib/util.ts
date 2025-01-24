import fs from "node:fs";
import path from "node:path";

/**
 * Checks if the given directory contains a NodeCG installation.
 * @param pathToCheck
 */
export function pathContainsNodeCG(pathToCheck: string): boolean {
	const pjsonPath = path.join(pathToCheck, "package.json");
	try {
		const pjson = JSON.parse(fs.readFileSync(pjsonPath, "utf-8"));
		return pjson.name.toLowerCase() === "nodecg";
	} catch {
		return false;
	}
}

/**
 * Gets the nearest NodeCG installation folder. First looks in process.cwd(), then looks
 * in every parent folder until reaching the root. Throws an error if no NodeCG installation
 * could be found.
 */
export function getNodeCGPath() {
	let curr = process.cwd();
	do {
		if (pathContainsNodeCG(curr)) {
			return curr;
		}

		const nextCurr = path.resolve(curr, "..");
		if (nextCurr === curr) {
			throw new Error(
				"NodeCG installation could not be found in this directory or any parent directory.",
			);
		}

		curr = nextCurr;
	} while (fs.lstatSync(curr).isDirectory());

	throw new Error(
		"NodeCG installation could not be found in this directory or any parent directory.",
	);
}

/**
 * Checks if the given directory is a NodeCG bundle.
 */
export function isBundleFolder(pathToCheck: string) {
	const pjsonPath = path.join(pathToCheck, "package.json");
	if (fs.existsSync(pjsonPath)) {
		const pjson = JSON.parse(fs.readFileSync(pjsonPath, "utf8"));
		return typeof pjson.nodecg === "object";
	}

	return false;
}

/**
 * Gets the currently-installed NodeCG version string, in the format "vX.Y.Z"
 */
export function getCurrentNodeCGVersion(): string {
	const nodecgPath = getNodeCGPath();
	return JSON.parse(fs.readFileSync(`${nodecgPath}/package.json`, "utf8"))
		.version;
}
