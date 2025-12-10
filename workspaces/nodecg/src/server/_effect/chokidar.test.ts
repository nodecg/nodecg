import path from "node:path";

import { FileSystem } from "@effect/platform";
import { NodeFileSystem } from "@effect/platform-node";
import { Chunk, Effect, Fiber, Stream } from "effect";
import { describe, expect, test } from "vitest";

import { getWatcher, listenToAdd, waitForReady } from "./chokidar.js";
import { testEffect } from "./test-effect.js";

describe("chokidar wrapper", () => {
	test(
		"getWatcher creates watcher and cleans up on scope close",
		testEffect(
			Effect.gen(function* () {
				const fs = yield* FileSystem.FileSystem;
				const tmpDir = yield* fs.makeTempDirectoryScoped();
				const watcher = yield* getWatcher(tmpDir);
				expect(watcher).toBeDefined();
				return watcher;
			}).pipe(
				Effect.scoped,
				Effect.andThen((watcher) => {
					expect(watcher.closed).toBe(true);
				}),
				Effect.provide(NodeFileSystem.layer),
			),
		),
	);

	test(
		"waitForReady waits for watcher ready event",
		testEffect(
			Effect.gen(function* () {
				const fs = yield* FileSystem.FileSystem;
				const tmpDir = yield* fs.makeTempDirectoryScoped();
				const watcher = yield* getWatcher(tmpDir);
				const readyEvent = yield* waitForReady(watcher);
				expect(readyEvent._tag).toBe("ready");
			}).pipe(Effect.provide(NodeFileSystem.layer)),
		),
	);

	test(
		"listenToAdd streams file add events",
		testEffect(
			Effect.gen(function* () {
				const fs = yield* FileSystem.FileSystem;
				const tmpDir = yield* fs.makeTempDirectoryScoped();

				const watcher = yield* getWatcher(tmpDir);

				const addStream = yield* listenToAdd(watcher);

				const eventsFiber = yield* addStream.pipe(
					Stream.take(1),
					Stream.runCollect,
					Effect.andThen(Chunk.head),
					Effect.fork,
				);

				yield* waitForReady(watcher);

				const testFile = path.join(tmpDir, "test.txt");
				yield* fs.writeFileString(testFile, "content");

				const event = yield* Fiber.join(eventsFiber);

				expect(event._tag).toBe("add");
				expect(event.path).toBe(testFile);
				expect(event.stats).toBeDefined();
			}).pipe(Effect.provide(NodeFileSystem.layer)),
		),
	);
});
