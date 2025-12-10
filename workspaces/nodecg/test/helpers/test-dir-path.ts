import fs from "node:fs";
import path from "node:path";

const findClosestPackageJsonDir = (dir: string): string => {
	const packageJsonPath = path.join(dir, "package.json");
	try {
		const packageJson = fs.readFileSync(packageJsonPath, "utf-8");
		JSON.parse(packageJson);
		return dir;
	} catch (e) {
		if (path.dirname(dir) === dir) {
			throw new Error("No package.json found in any parent directories.");
		}
		return findClosestPackageJsonDir(path.dirname(dir));
	}
};

export const testDirPath = (dir: string, absolute = false) => {
	const projectRoot = findClosestPackageJsonDir(__dirname);
	const targetPath = path.join(projectRoot, "test", dir);
	if (absolute) {
		return targetPath;
	}
	const relative = path.relative(process.cwd(), targetPath);
	return `./${relative}`;
};
