import fs from "node:fs";
import path from "node:path";

function recursivelyFindPackageJson(dir: string) {
	const packageJsonPath = path.join(dir, "package.json");
	if (fs.existsSync(packageJsonPath)) {
		const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
		if (packageJson.name === "nodecg") {
			return packageJson as { version: string };
		}
	}

	const parentDir = path.dirname(dir);
	if (dir === parentDir) {
		throw new Error("Could not find NodeCG root path");
	}

	return recursivelyFindPackageJson(parentDir);
}

export const nodecgPackageJson = recursivelyFindPackageJson(__dirname);
