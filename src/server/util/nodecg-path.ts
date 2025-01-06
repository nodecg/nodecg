import path from "node:path";

import { isLegacyProject } from "./project-type";
import { rootPath } from "./root-path";

export const nodecgPath = isLegacyProject
	? rootPath
	: path.join(rootPath, "node_modules/nodecg");
