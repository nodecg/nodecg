import * as fs from "node:fs";
import * as path from "node:path";

const findNodecgRoot = (dir: string): string => {
	const filePath = path.join(dir, "package.json");
	if (fs.existsSync(filePath)) {
		return path.dirname(filePath);
	}

	const parentDir = path.dirname(dir);
	if (dir === parentDir) {
		return "";
	}

	return findNodecgRoot(parentDir);
};

export const nodecgRootPath = findNodecgRoot(__dirname);
