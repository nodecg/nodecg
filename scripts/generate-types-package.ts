import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import appRootPath from "app-root-path";

const rootNodeModulesPath = appRootPath.resolve("node_modules");
const tmpNodeModulesPath = appRootPath.resolve("tmp_node_modules");
const outputDir = appRootPath.resolve("generated-types");

fs.rmSync(path.join(outputDir, "node_modules"), {
	recursive: true,
	force: true,
});

// Install dependencies in the types package
spawnSync("npm", ["i"], {
	cwd: outputDir,
	stdio: "inherit",
	shell: true,
});

// Without removing the root node_modules folder, tsc will use it along with the types package's node_modules
fs.renameSync(rootNodeModulesPath, tmpNodeModulesPath);

// Test that the typings and dependencies are valid
spawnSync("npx", ["tsc"], {
	cwd: outputDir,
	stdio: "inherit",
	shell: true,
});

// Roll back the node_modules folder
fs.renameSync(tmpNodeModulesPath, rootNodeModulesPath);
