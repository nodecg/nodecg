import fs from "node:fs";
import path from "node:path";

import { nearestProjectDirFromCwd } from "./find-nodejs-project.ts";

const rootPackageJson = JSON.parse(
	fs.readFileSync(path.join(nearestProjectDirFromCwd, "package.json"), "utf-8"),
);

export const isLegacyProject = rootPackageJson.nodecgRoot === true;

if (!isLegacyProject) {
	console.warn(
		"NodeCG is installed as a dependency. This is an experimental feature. Please report any issues you encounter.",
	);
}
