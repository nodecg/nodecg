import fs from "node:fs";
import path from "node:path";

import { rootPath } from "./root-path";

const rootPackageJson = fs.readFileSync(
	path.join(rootPath, "package.json"),
	"utf-8",
);

export const isLegacyProject = JSON.parse(rootPackageJson).name === "nodecg";
