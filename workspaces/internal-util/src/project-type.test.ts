import { FileSystem } from "@effect/platform";
import { SystemError } from "@effect/platform/Error";
import { NodePath } from "@effect/platform-node";
import { expect, layer } from "@effect/vitest";
import { Effect } from "effect";

import { mockedLayer } from "../test/mocked-service.ts";
import { detectProjectType } from "./project-type.ts";

layer(NodePath.layer)("detectProjectType", (it) => {
	it.effect(
		"detects legacy project when nodecgRoot is true",
		Effect.fn(function* () {
			const fsLayer = mockedLayer(FileSystem.FileSystem, {
				readFileString: () =>
					Effect.succeed(JSON.stringify({ nodecgRoot: true })),
			});
			const result = yield* detectProjectType("/1/2/3").pipe(
				Effect.provide(fsLayer),
			);
			expect(result.isLegacyProject).toBe(true);
		}),
	);

	it.effect(
		"should fail when nodecgRoot is false",
		Effect.fn(function* () {
			const fsLayer = mockedLayer(FileSystem.FileSystem, {
				readFileString: () =>
					Effect.succeed(JSON.stringify({ name: "foo", nodecgRoot: false })),
			});
			const result = yield* detectProjectType("/1/2/3").pipe(
				Effect.provide(fsLayer),
			);
			expect(result.isLegacyProject).toBe(false);
		}),
	);

	it.effect(
		"detects installed project when nodecgRoot is missing",
		Effect.fn(function* () {
			const fsLayer = mockedLayer(FileSystem.FileSystem, {
				readFileString: () => Effect.succeed(JSON.stringify({ name: "foo" })),
			});
			const result = yield* detectProjectType("/1/2/3").pipe(
				Effect.provide(fsLayer),
			);
			expect(result.isLegacyProject).toBe(false);
		}),
	);

	it.effect(
		"returns false when package.json has invalid JSON",
		Effect.fn(function* () {
			const fsLayer = mockedLayer(FileSystem.FileSystem, {
				readFileString: () => Effect.succeed(`{ invalid json }`),
			});
			const result = yield* detectProjectType("/1/2/3").pipe(
				Effect.provide(fsLayer),
			);
			expect(result.isLegacyProject).toBe(false);
		}),
	);

	it.effect(
		"returns false when package.json does not exist",
		Effect.fn(function* () {
			const fsLayer = mockedLayer(FileSystem.FileSystem, {
				readFileString: () =>
					Effect.fail(
						new SystemError({
							reason: "NotFound",
							module: "FileSystem",
							method: "readFileString",
						}),
					),
			});
			const result = yield* detectProjectType("/1/2/3").pipe(
				Effect.provide(fsLayer),
			);
			expect(result.isLegacyProject).toBe(false);
		}),
	);
});
