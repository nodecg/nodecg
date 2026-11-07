import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, FileSystem, Layer, Option, Path } from "effect";
import { describe, expect } from "vitest";

import { findPackageRoot } from "./package-root.ts";

const test = testLayer(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer));

describe("findPackageRoot", () => {
	test(
		"finds the nearest folder with a package.json at or above the start",
		Effect.gen(function* () {
			const fs = yield* FileSystem.FileSystem;
			const path = yield* Path.Path;
			const outer = yield* fs.makeTempDirectoryScoped();
			const inner = path.join(outer, "inner");
			const start = path.join(inner, "src", "server");
			yield* fs.makeDirectory(start, { recursive: true });
			yield* fs.writeFileString(path.join(outer, "package.json"), "{}");
			yield* fs.writeFileString(path.join(inner, "package.json"), "{}");

			expect(yield* findPackageRoot(start)).toStrictEqual(Option.some(inner));
		}),
	);

	test(
		"finds nothing outside any package",
		Effect.gen(function* () {
			const fs = yield* FileSystem.FileSystem;
			const outside = yield* fs.makeTempDirectoryScoped();

			const root = yield* findPackageRoot(outside).pipe(
				Effect.provideService(FileSystem.FileSystem, {
					...fs,
					exists: () => Effect.succeed(false),
				}),
			);

			expect(root).toStrictEqual(Option.none());
		}),
	);
});
