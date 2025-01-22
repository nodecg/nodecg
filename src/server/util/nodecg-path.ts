import path from "node:path";

import { rootPath } from "@nodecg/internal-util";

import { isLegacyProject } from "./project-type";

export const nodecgPath = isLegacyProject
	? rootPath
	: path.join(rootPath, "node_modules/nodecg");
