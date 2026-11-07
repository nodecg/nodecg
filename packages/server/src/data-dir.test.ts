import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { testLayer } from "@nodecg-next/test-utils";
import { ConfigProvider, Effect, FileSystem, Layer, Path } from "effect";
import { describe, expect } from "vitest";

import { resolveDataDir } from "./data-dir.ts";

const test = testLayer(
	Layer.mergeAll(
		NodeFileSystem.layer,
		NodePath.layer,
		ConfigProvider.layer(ConfigProvider.fromEnvRecord({ DATA_DIR: "data" })),
	),
);

const resolveFrom = Effect.fn(function* (workingDirectory: string) {
	const path = yield* Path.Path;
	return yield* resolveDataDir().pipe(
		Effect.provideService(Path.Path, {
			...path,
			resolve: (...segments) => path.resolve(workingDirectory, ...segments),
		}),
	);
});

describe("resolveDataDir", () => {
	test(
		"resolves a relative data directory against the nearest project above the working directory",
		Effect.gen(function* () {
			const fs = yield* FileSystem.FileSystem;
			const path = yield* Path.Path;
			const project = yield* fs.makeTempDirectoryScoped();
			yield* fs.writeFileString(path.join(project, "package.json"), "{}");
			const server = path.join(project, "src", "server");
			yield* fs.makeDirectory(server, { recursive: true });

			expect(yield* resolveFrom(server)).toBe(path.join(project, "data"));
		}),
	);

	test(
		"resolves a relative data directory against the working directory outside any project",
		Effect.gen(function* () {
			const fs = yield* FileSystem.FileSystem;
			const path = yield* Path.Path;
			const outside = yield* fs.makeTempDirectoryScoped();

			const resolved = yield* resolveFrom(outside).pipe(
				Effect.provideService(FileSystem.FileSystem, {
					...fs,
					exists: () => Effect.succeed(false),
				}),
			);

			expect(resolved).toBe(path.join(outside, "data"));
		}),
	);
});
