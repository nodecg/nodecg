import path from "node:path";

import { Data, Effect, Schema } from "effect";

import { FileSystemService } from "./file-system.js";

export class PathError extends Data.TaggedError("PathError")<{
	readonly message: string;
}> {}

const PackageJsonSchema = Schema.Struct({
	name: Schema.String,
	version: Schema.String,
	nodecg: Schema.optional(Schema.Unknown),
});

export class PathService extends Effect.Service<PathService>()("PathService", {
	effect: Effect.gen(function* () {
		const fs = yield* FileSystemService;

		const pathContainsNodeCG = Effect.fn("pathContainsNodeCG")(function* (
			checkPath: string,
		) {
			const pjsonPath = path.join(checkPath, "package.json");
			const pjson = yield* fs.readJson(pjsonPath, PackageJsonSchema);
			return pjson.name.toLowerCase() === "nodecg";
		});

		const isBundleFolder = Effect.fn("isBundleFolder")(function* (
			checkPath: string,
		) {
			const pjsonPath = path.join(checkPath, "package.json");
			const pjson = yield* fs.readJson(pjsonPath, PackageJsonSchema);
			return pjson.nodecg !== undefined;
		});

		const getNodeCGPath = Effect.fn("getNodeCGPath")(function* () {
			let curr = process.cwd();

			while (true) {
				const contains = yield* pathContainsNodeCG(curr).pipe(
					Effect.orElseSucceed(() => false),
				);
				if (contains) {
					return curr;
				}

				const nextCurr = path.resolve(curr, "..");
				if (nextCurr === curr) {
					return yield* Effect.fail(
						new PathError({
							message:
								"NodeCG installation could not be found in this directory or any parent directory.",
						}),
					);
				}
				curr = nextCurr;
			}
		});

		const getCurrentNodeCGVersion = Effect.fn("getCurrentNodeCGVersion")(
			function* () {
				const nodecgPath = yield* getNodeCGPath();
				const pjsonPath = path.join(nodecgPath, "package.json");
				const pjson = yield* fs.readJson(pjsonPath, PackageJsonSchema);
				return pjson.version;
			},
		);

		return {
			pathContainsNodeCG: Effect.fn("pathContainsNodeCG")(function* (
				checkPath: string,
			) {
				return yield* pathContainsNodeCG(checkPath).pipe(
					Effect.orElseSucceed(() => false),
				);
			}),
			getNodeCGPath,
			isBundleFolder: Effect.fn("isBundleFolder")(function* (
				checkPath: string,
			) {
				return yield* isBundleFolder(checkPath).pipe(
					Effect.orElseSucceed(() => false),
				);
			}),
			getCurrentNodeCGVersion,
		};
	}),
	dependencies: [FileSystemService.Default],
}) {}
