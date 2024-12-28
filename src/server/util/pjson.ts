import * as fs from "node:fs";
import * as path from "node:path";

import { nodecgRootPath } from "../../shared/utils/rootPath";

const pjsonPath = path.join(nodecgRootPath, "package.json");
const rawContents = fs.readFileSync(pjsonPath, "utf8");
export const pjson = JSON.parse(rawContents);
