import path from "node:path";
import { pathToFileURL } from "node:url";

import { Command, Options } from "@effect/cli";
import { Effect } from "effect";

import { FileSystemService } from "../services/file-system.js";
import { PathService } from "../services/path.js";

const recursivelyFindProject: (
	startDir: string,
) => Effect.Effect<string, Error, FileSystemService> = Effect.fn(
	"recursivelyFindProject",
)(function* (startDir: string) {
	const fs = yield* FileSystemService;

	if (!path.isAbsolute(startDir)) {
		return yield* Effect.fail(new Error("startDir must be an absolute path"));
	}

	const packageJsonPath = path.join(startDir, "package.json");
	const exists = yield* fs.exists(packageJsonPath);

	if (exists) {
		return startDir;
	}

	const parentDir = path.dirname(startDir);
	if (parentDir === startDir) {
		return yield* Effect.fail(new Error("Could not find a project directory"));
	}

	return yield* recursivelyFindProject(parentDir);
});

export const startCommand = Command.make(
	"start",
	{
		disableSourceMaps: Options.boolean("disable-source-maps").pipe(
			Options.withAlias("d"),
			Options.optional,
		),
	},
	() =>
		Effect.gen(function* () {
			const pathService = yield* PathService;

			const projectDir = yield* recursivelyFindProject(process.cwd());

			const containsNodeCG = yield* pathService.pathContainsNodeCG(projectDir);
			if (containsNodeCG) {
				yield* Effect.promise(
					() => import(pathToFileURL(path.join(projectDir, "index.js")).href),
				);
				return;
			}

			const nodecgDependencyPath = path.join(projectDir, "node_modules/nodecg");
			const hasNodeCGDep =
				yield* pathService.pathContainsNodeCG(nodecgDependencyPath);

			if (hasNodeCGDep) {
				yield* Effect.promise(
					() =>
						import(
							pathToFileURL(path.join(nodecgDependencyPath, "index.js")).href
						),
				);
			}
		}),
);
