import { FileSystem, Path } from "@effect/platform";
import { Data, Effect } from "effect";

export class NotInsideNodeJsProjectError extends Data.TaggedError(
	"NotInsideNodeJsProjectError",
)<{
	startDirectory: string;
}> {
	override readonly message = `Could not find Node.js project starting from directory: ${this.startDirectory}`;
}

export const findNodeJsProject = Effect.fn("findNodeJsProject")(function* (
	startDirectory: string,
) {
	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;

	let currentDir = startDirectory;

	while (true) {
		const packageJsonPath = path.join(currentDir, "package.json");
		const exists = yield* fs.exists(packageJsonPath);

		if (exists) {
			return currentDir;
		}

		const parentDir = path.dirname(currentDir);

		if (currentDir === parentDir) {
			return yield* new NotInsideNodeJsProjectError({ startDirectory });
		}

		currentDir = parentDir;
	}
});
