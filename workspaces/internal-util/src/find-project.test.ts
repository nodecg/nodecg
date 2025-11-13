import { FileSystem, Path } from "@effect/platform";
import { NodePath } from "@effect/platform-node";
import { assert, expect, layer, vi } from "@effect/vitest";
import { Effect } from "effect";

import { mockedLayer } from "../test/mocked-service.ts";
import {
	findNodeJsProject,
	NotInsideNodeJsProjectError,
} from "./find-project.ts";

layer(NodePath.layer)("findNodeJsProject", (it) => {
	it.effect(
		"finds package.json in the current directory",
		Effect.fn(function* () {
			const fsLayer = mockedLayer(FileSystem.FileSystem, {
				exists: () => Effect.succeed(true),
			});
			const result = yield* findNodeJsProject("/home/foo").pipe(
				Effect.provide(fsLayer),
			);
			expect(result).toBe("/home/foo");
		}),
	);

	it.effect(
		"finds package.json in a parent directory",
		Effect.fn(function* () {
			const path = yield* Path.Path;
			const parentDir = "/home/foo";
			const childDir = path.join(parentDir, "subdir1/subdir2");
			const packageJsonPath = path.join(parentDir, "package.json");

			const exists = vi.fn((searchPath: string) =>
				Effect.succeed(searchPath === packageJsonPath),
			);
			const fsLayer = mockedLayer(FileSystem.FileSystem, { exists });
			const result = yield* findNodeJsProject(childDir).pipe(
				Effect.provide(fsLayer),
			);
			expect(result).toBe(parentDir);
			expect(exists).toBeCalledTimes(3);
			expect(exists).nthCalledWith(1, path.join(childDir, "package.json"));
			expect(exists).nthCalledWith(2, path.join(childDir, "../package.json"));
			expect(exists).nthCalledWith(3, packageJsonPath);
			expect(exists).nthReturnedWith(1, Effect.succeed(false));
			expect(exists).nthReturnedWith(2, Effect.succeed(false));
			expect(exists).nthReturnedWith(3, Effect.succeed(true));
		}),
	);

	it.effect(
		"returns ProjectNotFoundError when reaching filesystem root",
		Effect.fn(function* () {
			const exists = vi.fn(() => Effect.succeed(false));
			const fsLayer = mockedLayer(FileSystem.FileSystem, { exists });

			const result = yield* findNodeJsProject("/1/2/3/4/5").pipe(
				Effect.provide(fsLayer),
				Effect.flip,
			);

			assert(result instanceof NotInsideNodeJsProjectError);
			expect(result.startDirectory).toBe("/1/2/3/4/5");
			expect(exists).toBeCalledTimes(6);
			expect(exists).nthCalledWith(1, "/1/2/3/4/5/package.json");
			expect(exists).nthCalledWith(2, "/1/2/3/4/package.json");
			expect(exists).nthCalledWith(3, "/1/2/3/package.json");
			expect(exists).nthCalledWith(4, "/1/2/package.json");
			expect(exists).nthCalledWith(5, "/1/package.json");
			expect(exists).nthCalledWith(6, "/package.json");
		}),
	);
});
