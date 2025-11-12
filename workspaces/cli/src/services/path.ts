import { Effect, Data } from "effect";
import { FileSystemService } from "./file-system.js";
import { Schema } from "@effect/schema";
import path from "node:path";

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

		const pathContainsNodeCG = (checkPath: string) =>
			Effect.gen(function* () {
				const pjsonPath = path.join(checkPath, "package.json");
				const pjson = yield* fs.readJson(pjsonPath, PackageJsonSchema);
				return pjson.name.toLowerCase() === "nodecg";
			}).pipe(Effect.orElseSucceed(() => false));

		const isBundleFolder = (checkPath: string) =>
			Effect.gen(function* () {
				const pjsonPath = path.join(checkPath, "package.json");
				const pjson = yield* fs.readJson(pjsonPath, PackageJsonSchema);
				return pjson.nodecg !== undefined;
			}).pipe(Effect.orElseSucceed(() => false));

		return {
			pathContainsNodeCG,

			getNodeCGPath: () =>
				Effect.gen(function* () {
					let curr = process.cwd();

					while (true) {
						const contains = yield* pathContainsNodeCG(curr);
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
				}),

			isBundleFolder,

			getCurrentNodeCGVersion: () =>
				Effect.gen(function* () {
					const self = yield* PathService;
					const nodecgPath = yield* self.getNodeCGPath();
					const pjsonPath = path.join(nodecgPath, "package.json");
					const pjson = yield* fs.readJson(pjsonPath, PackageJsonSchema);
					return pjson.version;
				}),
		};
	}),
	dependencies: [FileSystemService.Default],
	},
) {}
