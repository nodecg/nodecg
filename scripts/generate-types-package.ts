import * as fs from "node:fs";
import * as path from "node:path";

import appRootPath from "app-root-path";
import spawn from "nano-spawn";

const rootNodeModulesPath = appRootPath.resolve("node_modules");
const tmpNodeModulesPath = appRootPath.resolve("tmp_node_modules");
const outputDir = appRootPath.resolve("generated-types");

void (async () => {
	try {
		fs.rmSync(path.join(outputDir, "node_modules"), {
			recursive: true,
			force: true,
		});
		// Install dependencies in the types package
		await spawn("npm", ["i"], {
			cwd: outputDir,
			stdio: "inherit",
		});

		// Without removing the root node_modules folder, tsc will use it along with the types package's node_modules
		fs.cpSync(rootNodeModulesPath, tmpNodeModulesPath, { recursive: true });
		fs.rmSync(rootNodeModulesPath, { recursive: true });

		// Test that the typings and dependencies are valid
		await spawn("npx", ["tsc"], { cwd: outputDir, stdio: "inherit" });

		// Roll back the node_modules folder
		fs.renameSync(tmpNodeModulesPath, rootNodeModulesPath);
	} finally {
		// Clean up tmp_node_modules folder if generate() ended up with an error
		if (fs.existsSync(tmpNodeModulesPath)) {
			fs.renameSync(tmpNodeModulesPath, rootNodeModulesPath);
		}
	}
})();
