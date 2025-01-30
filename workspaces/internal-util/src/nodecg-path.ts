import path from "node:path";

import { rootPath } from "./nodecg-root";
import { isLegacyProject } from "./project-type";

export const nodecgPath = isLegacyProject
	? rootPath
	: path.join(rootPath, "node_modules/nodecg");
