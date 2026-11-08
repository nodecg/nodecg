import { Effect, FileSystem, Path, Stream } from "effect";

export const findPackageRoot = Effect.fn("findPackageRoot")(function* (
	from: string,
) {
	const fs = yield* FileSystem.FileSystem;
	const path = yield* Path.Path;
	return yield* Stream.iterate(from, (folder) => path.dirname(folder)).pipe(
		Stream.takeUntil((folder) => path.dirname(folder) === folder),
		Stream.filterEffect((folder) =>
			fs.exists(path.join(folder, "package.json")),
		),
		Stream.runHead,
	);
});
