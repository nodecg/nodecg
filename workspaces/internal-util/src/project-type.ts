import { FileSystem, Path } from "@effect/platform";
import { Effect, Schema } from "effect";

const packageJsonSchema = Schema.Struct({
	nodecgRoot: Schema.BooleanFromUnknown.pipe(Schema.optional),
});
const parsePackageJson = Schema.parseJson(packageJsonSchema).pipe(
	Schema.decode,
);

export const detectProjectType = Effect.fn("detectProjectType")(
	function* (projectRoot: string) {
		const fs = yield* FileSystem.FileSystem;
		const path = yield* Path.Path;

		const packageJson = yield* fs.readFileString(
			path.join(projectRoot, "package.json"),
		);
		const decoded = yield* parsePackageJson(packageJson);
		return { isLegacyProject: decoded.nodecgRoot === true };
	},
	Effect.tap(({ isLegacyProject }) =>
		isLegacyProject
			? Effect.logWarning(
					"NodeCG is installed as a dependency. This is an experimental feature. Please report any issues you encounter.",
				)
			: Effect.void,
	),
	Effect.catchTag(
		"SystemError",
		Effect.fn(function* (error) {
			yield* Effect.logDebug(`Failed to read package.json: ${error.message}`);
			return { isLegacyProject: false };
		}),
	),
	Effect.catchTag(
		"ParseError",
		Effect.fn(function* (error) {
			yield* Effect.logDebug(`Failed to parse package.json: ${error.message}`);
			return { isLegacyProject: false };
		}),
	),
);
