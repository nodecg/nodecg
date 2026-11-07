import { Effect, Option, Path } from "effect";

import { findPackageRoot } from "./package-root.ts";
import { config } from "./server-config.ts";
import { BackendError } from "./services/repository/repository-errors.ts";

export const resolveDataDir = Effect.fn("resolveDataDir")(
	function* () {
		const path = yield* Path.Path;
		const dataDir = yield* config.dataDir;
		if (path.isAbsolute(dataDir)) {
			return dataDir;
		}
		const workingDirectory = path.resolve();
		const project = yield* findPackageRoot(workingDirectory);
		return path.resolve(
			project.pipe(Option.getOrElse(() => workingDirectory)),
			dataDir,
		);
	},
	Effect.catchTag("PlatformError", (cause) => BackendError.make({ cause })),
);
