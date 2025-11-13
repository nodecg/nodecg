import { Path } from "@effect/platform";
import { Effect } from "effect";

import { findNodeJsProject } from "./find-project.ts";
import { detectProjectType } from "./project-type.ts";

export const getRuntimeRootPath = Effect.fn("getRuntimeRootPath")(function* (
	cwd: string,
) {
	return yield* findNodeJsProject(cwd);
});

export const getNodecgInstalledPath = Effect.fn("getNodecgInstalledPath")(
	function* (cwd: string) {
		const path = yield* Path.Path;
		const projectRoot = yield* findNodeJsProject(cwd);
		const projectType = yield* detectProjectType(projectRoot);
		return projectType.isLegacyProject
			? path.join(projectRoot, "workspaces/nodecg")
			: path.join(projectRoot, "node_modules/nodecg");
	},
);

export const getRuntimeRoot = Effect.gen(function* () {
	const nodecgRoot = process.env["NODECG_ROOT"];
	if (nodecgRoot) {
		return nodecgRoot;
	}

	return yield* getRuntimeRootPath(process.cwd());
});
