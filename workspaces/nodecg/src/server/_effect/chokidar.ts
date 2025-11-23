import type { Stats } from "node:fs";

import {
	type ChokidarOptions,
	type FSWatcher,
	type FSWatcherEventMap,
	watch,
} from "chokidar";
import { Data, Effect, Stream } from "effect";

import { listenToEvent, waitForEvent } from "./event-listener";

export const getWatcher = (
	paths: string | string[],
	options?: ChokidarOptions,
) =>
	Effect.acquireRelease(
		Effect.sync(() => watch(paths, options)),
		(watcher) => Effect.promise(() => watcher.close()),
	);

export type FileEvent = Data.TaggedEnum<{
	ready: object;
	add: { path: string; stats?: Stats };
	change: { path: string; stats?: Stats };
	addDir: { path: string; stats?: Stats };
	unlink: { path: string };
	unlinkDir: { path: string };
	error: { error: unknown };
}>;

export const fileEvent = Data.taggedEnum<FileEvent>();

export const waitForReady = (watcher: FSWatcher) =>
	waitForEvent<FSWatcherEventMap["ready"]>(watcher, "ready").pipe(
		Effect.andThen(() => fileEvent.ready()),
	);

const listenToChokidarEvent = <K extends keyof FSWatcherEventMap>(
	watcher: FSWatcher,
	eventName: K,
) => listenToEvent<FSWatcherEventMap[K]>(watcher, eventName);

export const listenToAdd = (watcher: FSWatcher) =>
	listenToChokidarEvent(watcher, "add").pipe(
		Effect.andThen(
			Stream.map(([path, stats]) => fileEvent.add({ path, stats })),
		),
	);
export const listenToChange = (watcher: FSWatcher) =>
	listenToChokidarEvent(watcher, "change").pipe(
		Effect.andThen(
			Stream.map(([path, stats]) => fileEvent.change({ path, stats })),
		),
	);
export const listenToAddDir = (watcher: FSWatcher) =>
	listenToChokidarEvent(watcher, "addDir").pipe(
		Effect.andThen(
			Stream.map(([path, stats]) => fileEvent.addDir({ path, stats })),
		),
	);
export const listenToUnlink = (watcher: FSWatcher) =>
	listenToChokidarEvent(watcher, "unlink").pipe(
		Effect.andThen(Stream.map(([path]) => fileEvent.unlink({ path }))),
	);
export const listenToUnlinkDir = (watcher: FSWatcher) =>
	listenToChokidarEvent(watcher, "unlinkDir").pipe(
		Effect.andThen(Stream.map(([path]) => fileEvent.unlinkDir({ path }))),
	);
export const listenToError = (watcher: FSWatcher) =>
	listenToChokidarEvent(watcher, "error").pipe(
		Effect.andThen(Stream.map(([error]) => fileEvent.error({ error }))),
	);
