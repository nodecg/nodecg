import fs from "node:fs";
import path from "node:path";

import { rootPath } from "@nodecg/internal-util";

const rootPackageJson = fs.readFileSync(
	path.join(rootPath, "package.json"),
	"utf-8",
);

export const isLegacyProject = JSON.parse(rootPackageJson).name === "nodecg";

if (!isLegacyProject) {
	console.warn(
		"NodeCG is installed as a dependency. This is an experimental feature. Please report any issues you encounter.",
	);
}
