# Phase 3: BundleManager Migration to Effect-TS

**Status**: Planned
**Complexity**: ⭐⭐⭐ Complex

## Overview

Migrate BundleManager from class-based EventEmitter architecture to Effect-based service using streams for file watching and PubSub for event distribution. This is the next logical step following the top-down (architecture/data/call flow) migration strategy, as BundleManager is the source of bundles (primary data) that all other subsystems consume.

## Goals

- Replace class-based BundleManager with functional BundleService
- Convert Chokidar file watching to Effect streams
- Replace EventEmitter with PubSub for event distribution
- Maintain hot-reloading functionality for bundles
- Update all consumers (GraphicsLib, DashboardLib, ExtensionManager, etc.)
- Delete old BundleManager code (no legacy code left)

## Current Architecture Analysis

### BundleManager Responsibilities

1. **Initial bundle loading** - Scans multiple paths for bundles at startup
2. **Bundle validation** - Checks compatibleRange, enabled/disabled lists
3. **File watching** - Monitors package.json, dashboard panels, .git changes via Chokidar
4. **Hot-reloading** - Re-parses and reloads bundles when files change
5. **Event emission** - Notifies consumers via events (ready, bundleChanged, gitChanged, invalidBundle, bundleRemoved)

### Dependencies

- `parseBundle` from bundle-parser (fp-ts based, functional)
- `parseBundleGit` for git metadata
- `loadBundleCfg` for bundle configs (cosmiconfig)
- Chokidar file watcher (module-level singleton)

### Consumers

- **GraphicsLib** - Uses `find()`, listens to `bundleChanged`, `gitChanged`
- **DashboardLib** - Uses `all()`, `find()`, listens to `bundleChanged`
- **ExtensionManager** - Uses `all()`, calls `remove()`
- **Server bootstrap** - Uses `all()`, listens to all events for bundles replicant
- **SentryConfig** - Listens to `ready`, `gitChanged`
- **MountsLib, SoundsLib, AssetsLib, SharedSourcesLib** - Uses `all()` snapshot

### Key Challenges

1. **Module-level singleton watcher** - Needs to become scoped resource
2. **Module-level bundles array** - Needs to become service state
3. **Event-based API** - Heavily used by consumers (multiple listeners)
4. **Backoff timer** - Debouncing changes without global state
5. **Git parsing** - Uses `process.chdir()` (side effect, needs isolation)

## Target Architecture

### Service Definition

```typescript
// Service with Ref for mutable state, PubSub for events
class BundleService extends Effect.Service<BundleService>()("BundleService", {
  scoped: Effect.gen(function* () {
    const bundles = yield* Ref.make<Array<NodeCG.Bundle>>([]);
    const pubsub = yield* PubSub.unbounded<BundleEvent>();
    const watcher = yield* createFileWatcher([], watchOptions);

    // Load initial bundles
    const initialBundles = yield* loadInitialBundles();
    yield* Ref.set(bundles, initialBundles);

    // Setup file watching stream
    yield* Effect.forkScoped(watchFiles(watcher, bundles, pubsub));

    // Emit ready event after threshold
    yield* Effect.forkScoped(
      Effect.sleep("1 second").pipe(
        Effect.flatMap(() => PubSub.publish(pubsub, { _tag: "ready" })),
      ),
    );

    return {
      all: Effect.fn(() => Ref.get(bundles)),
      find: Effect.fn((name: string) =>
        Ref.get(bundles).pipe(
          Effect.map((arr) => arr.find((b) => b.name === name)),
        ),
      ),
      subscribe: pubsub,
      add: Effect.fn((bundle) => {
        /* update Ref */
      }),
      remove: Effect.fn((name) => {
        /* update Ref + publish event */
      }),
    };
  }),
}) {}
```

### Event Types

```typescript
import { Data } from "effect";

// Define events using Effect's TaggedEnum
const BundleEvent = Data.taggedEnum<{
  Ready: {};
  BundleChanged: { readonly bundle: NodeCG.Bundle };
  GitChanged: { readonly bundle: NodeCG.Bundle };
  InvalidBundle: { readonly bundle: NodeCG.Bundle; readonly error: Error };
  BundleRemoved: { readonly bundleName: string };
}>();

type BundleEvent = Data.TaggedEnum.Value<typeof BundleEvent>;

// Usage - constructors automatically created:
BundleEvent.Ready({});
BundleEvent.BundleChanged({ bundle });
BundleEvent.GitChanged({ bundle });
BundleEvent.InvalidBundle({ bundle, error });
BundleEvent.BundleRemoved({ bundleName });
```

### Key Patterns

- `Ref<Array<NodeCG.Bundle>>` for mutable bundle list
- `PubSub<BundleEvent>` for event distribution (replaces EventEmitter)
- `Stream` for Chokidar file watching events
- `Effect.acquireRelease` for watcher lifecycle management
- `Effect.forkScoped` for background file watching
- Debouncing via `Effect.sleep` instead of timer references

## Key Decisions

### 1. PubSub vs Queue for Event Distribution

**Decision**: Use `PubSub` for event distribution

**Rationale**:

- Multiple consumers need to receive the same events
- Queue consumes messages (only one subscriber gets each event)
- PubSub broadcasts to all subscribers (EventEmitter replacement)
- Each consumer can filter events they care about via Stream

### 2. Service Layer Parameters vs Config Service

**Decision**: Pass parameters to layer creation function for now

**Rationale**:

- Config service migration is deferred (not prioritized for top-down approach)
- BundleService needs bundle paths, cfgPath, version, config immediately
- Layer creation function can accept these as parameters
- Can refactor to ConfigService later when available

### 3. Chokidar Wrapper Strategy

**Decision**: Create Effect wrapper that converts Chokidar events to Stream

**Rationale**:

- Chokidar is callback-based, needs Effect integration
- Stream is perfect for continuous file events
- `Effect.acquireRelease` ensures watcher cleanup
- Stream can be forked in background with automatic cleanup

### 4. Debouncing Strategy

**Decision**: Use `Effect.sleep` with Ref-based state tracking

**Rationale**:

- No global timer references (pure functional)
- Ref tracks which bundles have pending changes
- Sleep provides natural debounce window
- Composable with Effect error handling

## Implementation Plan

### Step 1: Create General-Purpose File Watching Layer

**New file**: `workspaces/nodecg/src/server/_effect/file-watcher.ts`

General-purpose Chokidar → Effect Stream wrapper for reusable file watching across NodeCG.

```typescript
import { Data, Stream, Effect, Scope, Schedule, Duration } from "effect";
import type * as fs from "node:fs";
import type * as chokidar from "chokidar";

// File watcher events using TaggedEnum
export const FileEvent = Data.taggedEnum<{
  Add: { readonly path: string; readonly stats?: fs.Stats };
  Change: { readonly path: string; readonly stats?: fs.Stats };
  Unlink: { readonly path: string };
  AddDir: { readonly path: string; readonly stats?: fs.Stats };
  UnlinkDir: { readonly path: string };
  Ready: {};
}>();

export type FileEvent = Data.TaggedEnum.Value<typeof FileEvent>;

// Error types - separate initialization vs runtime errors
export class FileWatchInitError extends Data.TaggedError("FileWatchInitError")<{
  readonly cause: unknown;
}> {}

export class FileWatchError extends Data.TaggedError("FileWatchError")<{
  readonly cause: unknown;
}> {}

/**
 * Creates a file watcher as a scoped resource.
 * Automatically closes watcher when scope exits.
 *
 * @fails FileWatchInitError - When watcher creation fails (e.g., invalid path, permissions)
 */
export const createWatcher = (
  paths: string | ReadonlyArray<string>,
  options?: chokidar.WatchOptions,
): Effect.Effect<chokidar.FSWatcher, FileWatchInitError, Scope.Scope> =>
  Effect.acquireRelease(
    Effect.try({
      try: () => chokidar.watch(paths, options),
      catch: (cause) => new FileWatchInitError({ cause }),
    }),
    (watcher) => Effect.promise(() => watcher.close()),
  );

/**
 * Converts a Chokidar watcher to an Effect Stream of file events.
 * Stream continues until watcher is closed or error occurs.
 *
 * @fails FileWatchError - When filesystem errors occur during watching
 */
export const toStream = (
  watcher: chokidar.FSWatcher,
): Stream.Stream<FileEvent, FileWatchError> =>
  Stream.async<FileEvent, FileWatchError>((emit) => {
    const onAdd = (path: string, stats?: fs.Stats) =>
      emit.single(FileEvent.Add({ path, stats }));
    const onChange = (path: string, stats?: fs.Stats) =>
      emit.single(FileEvent.Change({ path, stats }));
    const onUnlink = (path: string) => emit.single(FileEvent.Unlink({ path }));
    const onAddDir = (path: string, stats?: fs.Stats) =>
      emit.single(FileEvent.AddDir({ path, stats }));
    const onUnlinkDir = (path: string) =>
      emit.single(FileEvent.UnlinkDir({ path }));
    const onReady = () => emit.single(FileEvent.Ready({}));
    const onError = (error: Error) =>
      emit.fail(new FileWatchError({ cause: error }));

    watcher.on("add", onAdd);
    watcher.on("change", onChange);
    watcher.on("unlink", onUnlink);
    watcher.on("addDir", onAddDir);
    watcher.on("unlinkDir", onUnlinkDir);
    watcher.on("ready", onReady);
    watcher.on("error", onError);

    return Effect.sync(() => {
      watcher.removeListener("add", onAdd);
      watcher.removeListener("change", onChange);
      watcher.removeListener("unlink", onUnlink);
      watcher.removeListener("addDir", onAddDir);
      watcher.removeListener("unlinkDir", onUnlinkDir);
      watcher.removeListener("ready", onReady);
      watcher.removeListener("error", onError);
    });
  });

/**
 * Creates watcher and returns Stream. Watcher is scoped to Stream's lifecycle.
 * Optionally retries on errors with exponential backoff.
 *
 * @param paths - Paths to watch
 * @param options - Chokidar watch options
 * @param retryConfig - Optional retry configuration for automatic error recovery
 * @returns Stream of file events
 * @fails FileWatchInitError | FileWatchError - Initialization or runtime errors
 *
 * @example
 * // Simple watch (no retry)
 * FileWatcher.watch(paths, { ignored: /node_modules/ })
 *
 * // With automatic retry (recommended for production)
 * FileWatcher.watch(paths, options, {
 *   maxRetries: 5,
 *   baseDelay: "1 second" // Exponential: 1s, 2s, 4s, 8s, 16s (with jitter)
 * })
 */
export const watch = (
  paths: string | ReadonlyArray<string>,
  options?: chokidar.WatchOptions,
  retryConfig?: {
    readonly maxRetries?: number;
    readonly baseDelay?: Duration.DurationInput;
  },
): Stream.Stream<
  FileEvent,
  FileWatchInitError | FileWatchError,
  Scope.Scope
> => {
  const stream = Stream.acquireRelease(
    createWatcher(paths, options),
    (watcher) => Effect.promise(() => watcher.close()),
  ).pipe(Stream.flatMap(toStream));

  // Apply retry if config provided
  if (retryConfig) {
    const maxRetries = retryConfig.maxRetries ?? 5;
    const baseDelay = retryConfig.baseDelay ?? "1 second";

    const retrySchedule = Schedule.exponential(baseDelay).pipe(
      Schedule.compose(Schedule.recurs(maxRetries)),
      Schedule.jittered, // Add randomness to prevent thundering herd
    );

    return stream.pipe(Stream.retry(retrySchedule));
  }

  return stream;
};
```

**Usage in BundleService**:

```typescript
import * as FileWatcher from "../_effect/file-watcher";

// Option 1: Simple watch (no retry)
yield *
  Effect.forkScoped(
    FileWatcher.watch(bundlePaths, {
      ignored: /node_modules/,
      ignoreInitial: true,
    }).pipe(
      Stream.filter((event) => event._tag === "Change"),
      Stream.runForEach((event) => handleChange(event.path)),
    ),
  );

// Option 2: Watch with automatic retry (RECOMMENDED for production)
yield *
  Effect.forkScoped(
    FileWatcher.watch(
      bundlePaths,
      {
        ignored: /node_modules/,
        ignoreInitial: true,
      },
      {
        maxRetries: 5,
        baseDelay: "1 second", // 1s, 2s, 4s, 8s, 16s (with jitter)
      },
    ).pipe(Stream.runForEach((event) => handleFileEvent(event))),
  );

// Option 3: Manual control (create watcher separately)
const watcher =
  yield *
  FileWatcher.createWatcher(bundlePaths, {
    ignored: /node_modules/,
    ignoreInitial: true,
  });

yield *
  Effect.forkScoped(
    FileWatcher.toStream(watcher).pipe(
      Stream.runForEach((event) => handleFileEvent(event)),
    ),
  );
```

**New file**: `workspaces/nodecg/src/server/_effect/git-parser.ts`

Effect wrapper for git parsing (isolates process.chdir side effect):

```typescript
import { Effect } from "effect";
import { parseBundleGit } from "../bundle-parser/git";

export const parseGit = Effect.fn("parseGit")(function* (bundleDir: string) {
  return yield* Effect.sync(() => parseBundleGit(bundleDir));
});
```

### Step 2: Implement BundleService

**New file**: `workspaces/nodecg/src/server/bundle-service.ts`

Core service implementation with:

- Initial bundle loading
- Ref for bundle list state
- PubSub for events
- File watcher setup
- File event processing stream
- Bundle change/git change handlers
- Debouncing logic

### Step 3: Update Consumers

**Pattern for migrating EventEmitter listeners to PubSub streams**:

```typescript
// Before (EventEmitter)
bundleManager.on("bundleChanged", (bundle) => {
  // Handle change
});

// After (PubSub + Stream)
yield *
  Effect.forkScoped(
    Stream.fromPubSub(bundleService.subscribe).pipe(
      Stream.filter((event) => event._tag === "BundleChanged"),
      Stream.runForEach((event) =>
        Effect.sync(() => {
          // Handle change with event.bundle
        }),
      ),
    ),
  );

// Or handle multiple event types
yield *
  Effect.forkScoped(
    Stream.fromPubSub(bundleService.subscribe).pipe(
      Stream.filter(
        (event) =>
          event._tag === "BundleChanged" || event._tag === "GitChanged",
      ),
      Stream.runForEach((event) =>
        Effect.sync(() => {
          // Both events have bundle property
          rebuildPanels(event.bundle);
        }),
      ),
    ),
  );
```

**Files to update**:

- `server/server/index.ts` - Replace BundleManager instantiation, update event listeners
- `server/graphics/index.ts` - Migrate event listeners
- `server/graphics/registration.ts` - Migrate event listeners
- `server/dashboard/index.ts` - Migrate event listeners
- `server/util/sentry-config.ts` - Migrate event listeners

### Step 4: Provide BundleService Layer

**Layer creation**:

```typescript
export const makeBundleServiceLayer = (
  bundlesPaths: string[],
  cfgPath: string,
  nodecgVersion: string,
  nodecgConfig: Record<string, any>,
) => Layer.scoped(BundleService /* implementation */);
```

**Bootstrap integration**:

```typescript
// In bootstrap.ts
const bundleServiceLayer = makeBundleServiceLayer(
  bundlesPaths,
  cfgPath,
  nodecgPackageJson.version,
  config,
);

yield * createServer().pipe(Effect.provide(bundleServiceLayer));
```

### Step 5: Update Tests

**Pattern**:

```typescript
test("bundle loading", async () => {
  await testEffect(
    Effect.gen(function* () {
      const bundleService = yield* BundleService;
      const bundles = yield* bundleService.all();

      expect(bundles.length).toBeGreaterThan(0);

      // Subscribe to events
      const events: BundleEvent[] = [];
      yield* Effect.forkScoped(
        Stream.fromPubSub(bundleService.subscribe).pipe(
          Stream.take(1),
          Stream.runForEach((event) => Effect.sync(() => events.push(event))),
        ),
      );

      // Trigger change, verify event received
    }).pipe(Effect.provide(testBundleServiceLayer)),
  );
});
```

**Files to update**:

- `workspaces/nodecg/src/server/bundle-manager.test.ts` - Rewrite for Effect
- `workspaces/nodecg/test/helpers/setup.ts` - Provide BundleService layer

### Step 6: Delete Old Code

Once all consumers migrated and tests passing:

- Delete `workspaces/nodecg/src/server/bundle-manager.ts`

## Files Modified

**New files**:

- `workspaces/nodecg/src/server/bundle-service.ts` - Main service
- `workspaces/nodecg/src/server/_effect/file-watcher.ts` - Chokidar wrapper
- `workspaces/nodecg/src/server/_effect/git-parser.ts` - Git parsing wrapper

**Modified files**:

- `workspaces/nodecg/src/server/server/index.ts` - Use BundleService
- `workspaces/nodecg/src/server/graphics/index.ts` - Subscribe to events
- `workspaces/nodecg/src/server/graphics/registration.ts` - Subscribe to events
- `workspaces/nodecg/src/server/dashboard/index.ts` - Subscribe to events
- `workspaces/nodecg/src/server/util/sentry-config.ts` - Subscribe to events
- `workspaces/nodecg/src/server/bundle-manager.test.ts` - Update to Effect
- `workspaces/nodecg/test/helpers/setup.ts` - Provide BundleService layer

**Deleted files**:

- `workspaces/nodecg/src/server/bundle-manager.ts` - Replaced by bundle-service.ts

## Testing Strategy

1. **Unit tests** - Test BundleService in isolation with mock file watcher
2. **Integration tests** - Test file watching with temp directories
3. **E2E tests** - Test bundle hot-reloading in real scenarios
4. **Regression tests** - Ensure all existing tests still pass

## Risks

1. **PubSub complexity** - Multiple consumers with different event filtering needs
2. **Chokidar lifecycle** - Proper cleanup of file watchers, avoiding leaks
3. **Race conditions** - File events vs bundle state updates (need proper sequencing)
4. **Backoff logic** - Debouncing rapid changes without global mutable state
5. **Git parsing isolation** - `process.chdir()` side effect needs careful handling
6. **Consumer migration scope** - Many files depend on BundleManager events

## Open Questions

1. **Debouncing strategy** - Should we use `Effect.debounce` or manual timing with `Ref`?
2. **Git parsing isolation** - Should we wrap `process.chdir()` more carefully or accept the side effect?
3. **Event filtering** - Should consumers filter PubSub events themselves, or should service provide filtered subscriptions?
4. **Error recovery** - How should service handle invalid bundles? Continue watching or fail?

## Next Steps

- [ ] Create file-watcher.ts wrapper
- [ ] Create git-parser.ts wrapper
- [ ] Implement BundleService core
- [ ] Implement file event processing
- [ ] Update server/index.ts consumer
- [ ] Update graphics consumer
- [ ] Update dashboard consumer
- [ ] Update other consumers
- [ ] Update tests
- [ ] Verify all tests pass
- [ ] Delete bundle-manager.ts
- [ ] Update this log with problems/solutions
- [ ] Mark as Completed

## Effect Patterns to Establish

### Pattern: Data.TaggedEnum for Event Types

Using `Data.TaggedEnum` to define discriminated union types with automatic constructors:

```typescript
const EventType = Data.taggedEnum<{
  TypeA: { readonly field: string };
  TypeB: { readonly num: number };
}>();

type EventType = Data.TaggedEnum.Value<typeof EventType>;

// Automatic constructors
const a = EventType.TypeA({ field: "value" });
const b = EventType.TypeB({ num: 42 });

// Pattern matching
if (event._tag === "TypeA") {
  console.log(event.field); // TypeScript knows the shape
}
```

**Benefits**: Type-safe constructors, automatic pattern matching support, follows Effect conventions.

### Pattern: Chokidar → Stream Conversion

Wrapping callback-based file watchers as Effect streams for composable file watching with proper resource management.

### Pattern: EventEmitter → PubSub Migration

Converting class-based EventEmitter APIs to functional PubSub + Stream patterns for event distribution to multiple consumers.

### Pattern: Stateful Service with Ref

Using `Ref` for mutable state within Effect services while maintaining referential transparency and composability.

### Pattern: Background Stream Processing

Forking long-running streams with `Effect.forkScoped` for automatic cleanup when scope closes.
