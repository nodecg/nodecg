import fs from "node:fs";
import path from "node:path";

import { getNearestProjectDirFromCwd } from "./find-nodejs-project.ts";

let _cachedIsLegacyProject: boolean | undefined;

export function isLegacyProject(): boolean {
	if (_cachedIsLegacyProject === undefined) {
		const rootPackageJson = JSON.parse(
			fs.readFileSync(
				path.join(getNearestProjectDirFromCwd(), "package.json"),
				"utf-8",
			),
		);

		_cachedIsLegacyProject =
			rootPackageJson.nodecgRoot === true || rootPackageJson.name === "nodecg";

		if (!_cachedIsLegacyProject) {
			console.warn(
				"NodeCG is installed as a dependency. This is an experimental feature. Please report any issues you encounter.",
			);
		}
	}
	return _cachedIsLegacyProject;
}
