# Phase 5: BundleManager (Effect.Service)

**Status**: TEST FAILING
**Complexity**: ⭐⭐⭐ Complex

## Overview

Replace the legacy class-based `BundleManager` with an Effect-based `BundleManager` service. The new implementation will use `Ref` for state management, `PubSub` for event broadcasting, and the chokidar wrapper from Phase 3 for file watching. Git parsing will be wrapped in Effect using `isomorphic-git`.

## Goals

- Create `BundleManager` using `Effect.Service` (no classes)
- Replace module-level state with scoped `Ref<Array<NodeCG.Bundle>>`
- Replace `EventEmitter` events with `PubSub<BundleEvent>`
- Use Phase 3 chokidar wrapper for file watching
- Wrap git parsing in Effect (replace `git-rev-sync` with `isomorphic-git`)
- Preserve ready/debounce timing semantics
- Update consumers to use service interface

## Current Architecture (Legacy)

**Module-level state** (`server/server/bundle-manager.ts`):

- `watcher`: Module-level chokidar instance
- `bundles: NodeCG.Bundle[]`: Mutable array
- `hasChanged: Set<string>`: Pending bundle names during backoff
- `backoffTimer: NodeJS.Timeout`: Debounce timer

**Timing behavior**:

- Ready delay: Initial 1000ms timeout, restarted on each `add` event via `refresh()` (`READY_WAIT_THRESHOLD`)
- Change handling: 100ms initial delay (`handleChange`)
- Backoff: 500ms between reparse cycles (`resetBackoffTimer`)
- Git change: 250ms debounce (`_debouncedGitChangeHandler`)

**Events emitted**:

- `ready`: Initial scan complete
- `bundleChanged`: Bundle reparsed successfully
- `invalidBundle`: Bundle reparse failed
- `bundleRemoved`: Bundle removed from list
- `gitChanged`: Git metadata updated

## Target Architecture

### BundleManager Service (`src/server/server/bundle-manager.ts` - rewrite in place)

```typescript
export class BundleManager extends Effect.Service<BundleManager>()("BundleManager", {
  scoped: Effect.gen(function* () {
    const gitService = yield* GitService;

    // Config derived from existing imports (same as server/index.ts:181-189)
    const bundlesPaths = [
      path.join(rootPaths.getRuntimeRoot(), "bundles"),
      ...(config.bundles?.paths ?? []),
    ];
    const cfgPath = path.join(rootPaths.getRuntimeRoot(), "cfg");
    const nodecgVersion = nodecgPackageJson.version;
    const nodecgConfig = config;

    const bundlesRef = yield* Ref.make<Array<NodeCG.Bundle>>([]);
    const events = yield* PubSub.unbounded<BundleEvent>();

    // Initialize watcher, parse bundles, fork event handlers...

    // Subscribe and filter by tag - each call creates fresh scoped subscription
    const listenTo = <Tag extends BundleEvent["_tag"]>(tag: Tag) =>
      Effect.gen(function* () {
        const queue = yield* PubSub.subscribe(events);
        return Stream.fromQueue(queue).pipe(
          Stream.filter((e): e is Extract<BundleEvent, { _tag: Tag }> => e._tag === tag),
        );
      });

    return {
      all: Effect.fn(function* () { return yield* Ref.get(bundlesRef); }),
      find: Effect.fn(function* (name: string) { ... }),
      listenTo,  // bundleManager.listenTo("bundleChanged")
      waitForReady: () => listenTo("ready").pipe(
        Effect.andThen(Stream.take(1)),
        Effect.andThen(Stream.runDrain),
      ),
    };
  }),
  dependencies: [GitService.Default],
}) {}
```

### BundleEvent Tagged Union

```typescript
export type BundleEvent = Data.TaggedEnum<{
  ready: object;
  bundleChanged: { bundle: NodeCG.Bundle };
  invalidBundle: { bundle: NodeCG.Bundle; error: Error };
  bundleRemoved: { bundleName: string };
  gitChanged: { bundle: NodeCG.Bundle };
}>;
```

### GitService Interface

See actual implementation: [src/server/\_effect/git-service.ts](../../workspaces/nodecg/src/server/_effect/git-service.ts)

- `getGitHead(bundlePath)` - Returns `Effect<Option<GitHeadData>, GitError>`
- `GitHeadData`: `{ hash, shortHash, date, message, branch: Option<string> }`
- Error types: `GitBranchReadError`, `GitHeadReadError`, `GitDateParseError`
- Dependencies: `FileSystem.FileSystem`, `Path.Path` via `dependencies` option

### Debounce/Backoff Implementation

Use Effect's Stream APIs for timing control:

- **Ready delay**: Prepend initial tick + `Stream.debounce("1000 millis")` to match `setTimeout.refresh()` semantics
- **Change handling**: 100ms delay via `Effect.sleep("100 millis")` before reparse
- **Backoff**: `Stream.groupByKey` + `GroupBy.evaluate` with `Stream.debounce("500 millis")` per bundle
- **Git debounce**: `Stream.groupByKey` + `GroupBy.evaluate` with `Stream.debounce("250 millis")` per bundle

```typescript
// Tick marker for timing (no payload needed)
interface Tick {
  readonly _tag: "Tick";
}
const Tick = Data.tagged<Tick>("Tick");

// BundleEvent constructor
const bundleEvent = Data.taggedEnum<BundleEvent>();

// Ready event fires 1000ms after last add event, or initial 1000ms if no adds
// Prepending a tick ensures debounce fires even with zero add events
addStream.pipe(
  Stream.as(Tick()),
  Stream.prepend(Chunk.of(Tick())),
  Stream.debounce("1000 millis"),
  Stream.take(1),
  Stream.runDrain,
  Effect.andThen(() => PubSub.publish(events, bundleEvent.ready())),
);

// Per-bundle change debouncing with GroupBy.evaluate
changeStream.pipe(
  Stream.groupByKey((event) => getBundleName(event.path)),
  GroupBy.evaluate((bundleName, stream) =>
    stream.pipe(
      Stream.debounce("500 millis"),
      Stream.runForEach(() => handleBundleChange(bundleName)),
    ),
  ),
  Stream.runDrain,
);
```

### Initial Bundle Loading

Bundles loaded synchronously during `scoped` initialization (same as current behavior).

## Key Decisions

1. **Rewrite in place** - Keep `src/server/server/bundle-manager.ts` location, change implementation
2. **GitService separate** - Isolated in `_effect/git-service.ts` due to `isomorphic-git` side effects
3. **Generic `listenTo(tag)` method** - Single method with tag parameter, not individual `listenToBundleChanged()` etc.
4. **PubSub.unbounded** - Events are infrequent, subscriber queues bounded by consumption rate
5. **Ref for state** - Atomic updates, type-safe, scoped lifecycle
6. **Stream.debounce for timing** - Ready (1000ms with prepend), backoff (500ms via GroupBy.evaluate), git (250ms via GroupBy.evaluate)
7. **Sync initial loading** - Bundles loaded during `scoped` initialization

## Implementation Plan

### 1. GitService (Effect.Service) ✅

- [x] Create `git-service.ts` as full `Effect.Service`
- [x] Implement `getGitHead(bundlePath)` returning `Effect<Option<GitHeadData>, GitError>`
- [x] Use `isomorphic-git` for branch, hash, date, message
- [x] Handle missing `.git` directory gracefully (return `Option.none()`)
- [x] Handle detached HEAD (return data with `branch: Option.none()`)
- [x] Handle empty repo (no commits) gracefully (return `Option.none()`)
- [x] Concrete error types: `GitBranchReadError`, `GitHeadReadError`, `GitDateParseError`
- [x] Add tests (real `git` commands via `@effect/platform` Command for setup, error path coverage)

**Implementation**: [src/server/\_effect/git-service.ts](../../workspaces/nodecg/src/server/_effect/git-service.ts)
**Tests**: [src/server/\_effect/git-service.test.ts](../../workspaces/nodecg/src/server/_effect/git-service.test.ts)

### 2. BundleManager Core ✅

- [x] Rewrite `bundle-manager.ts` in place
- [x] Define `BundleEvent` tagged enum
- [x] Implement `BundleManager` with:
  - `bundlesRef: Ref<Array<NodeCG.Bundle>>`
  - `events: PubSub<BundleEvent>`
  - `all()`: Read from Ref
  - `find(name)`: Read and filter from Ref
  - `remove(name)`: Remove bundle from Ref and publish event

### 3. File Watching ✅

- [x] Use `getWatcher` from `_effect/chokidar.ts`
- [x] Merge `listenToAdd`, `listenToChange`, `listenToUnlink` streams
- [x] Ready delay: `Stream.as(Tick())` + `Stream.prepend(Tick())` + `Stream.debounce("1000 millis")` + `Stream.take(1)`
- [x] Route change/unlink events through change handler

### 4. Change Handling ✅

- [x] Group change events by bundle name (`Stream.groupByKey`)
- [x] Apply `GroupBy.evaluate` with `Stream.debounce("500 millis")` per bundle for backoff
- [x] 100ms delay before each reparse (`Effect.sleep("100 millis")`)
- [x] Publish `bundleChanged` or `invalidBundle` after reparse

### 5. Git Change Handling ✅

- [x] Filter `.git` directory changes from file events
- [x] Group by bundle name (`Stream.groupByKey`)
- [x] Apply `GroupBy.evaluate` with `Stream.debounce("250 millis")` per bundle
- [x] Call `GitService.getGitHead(bundlePath)` and update bundle in Ref
- [x] Publish `gitChanged` event

### 6. Bootstrap Integration ✅

- [x] Provide `BundleManager.Default` layer in bootstrap.ts

### 7. Consumer Updates ✅

- [x] Update bootstrap to provide `BundleManager` layer
- [x] Update server/index.ts to use `yield* BundleManager` pattern
- [x] Update ExtensionManager to accept bundles array + removeBundle callback
- [x] Remove direct BundleManager parameter passing from routers

### 8. Testing ✅

- [x] Unit tests for git service
- [x] Rewrite bundle-manager.test.ts for Effect-based API
- [x] Adapt E2E test helpers to provide BundleManager layer
- [x] Fix test setup with dynamic imports for NODECG_ROOT ordering

### 9. Cleanup

- [ ] Remove `git-rev-sync` from dependencies (can be done later)

## Risks & Mitigations

| Risk                             | Mitigation                                        |
| -------------------------------- | ------------------------------------------------- |
| Timing drift                     | Mirror legacy delays exactly (1000/100/500/250ms) |
| `isomorphic-git` API differences | Test git parsing thoroughly before removal        |
| PubSub backpressure              | Use unbounded PubSub (events are infrequent)      |
| Consumer breakage                | Update all consumers in same PR                   |

## Dependencies

- Phase 3 (chokidar wrapper) - ✅ Complete
- Phase 4 (consumer migration) - ✅ Complete

## Files Modified

**Created**:

- `src/server/_effect/git-service.ts` - GitService with isomorphic-git ✅
- `src/server/_effect/git-service.test.ts` - GitService tests ✅

**Rewritten**:

- `src/server/server/bundle-manager.ts` - BundleManager as Effect.Service ✅
- `src/server/server/bundle-manager.test.ts` - Effect-based tests ✅

**Updated**:

- `src/server/server/index.ts` - Use service pattern, create runtime for callbacks ✅
- `src/server/server/extensions.ts` - Accept bundles array + removeBundle callback ✅
- `src/server/bootstrap.ts` - Provide BundleManager.Default layer ✅
- `test/helpers/setup.ts` - Provide BundleManager layer to test server ✅
- `test/installed-mode/setup.ts` - Provide BundleManager layer to test server ✅

**Not modified** (consumers already use Effect.fn, no changes needed):

- `src/server/server/dashboard.ts`
- `src/server/server/graphics/index.ts`
- `src/server/server/graphics/registration.ts`
- `src/server/server/assets.ts`
- `src/server/server/sounds.ts`
- `src/server/server/mounts.ts`
- `src/server/server/shared-sources.ts`

## Lessons Learned

### isomorphic-git Branch Return Type

`isomorphic-git`'s `currentBranch()` returns `string | void`, not `string | undefined`. Use explicit typeof check:

```typescript
const branchResult = yield* Effect.tryPromise(...);
const branch = typeof branchResult === "string"
  ? Option.some(branchResult)
  : Option.none();
```

### Test Setup with Dynamic Imports

When tests depend on environment variables (like `NODECG_ROOT`) being set before module import, use dynamic imports in `beforeAll`:

```typescript
let BundleManager: typeof import("./bundle-manager").BundleManager;

beforeAll(async () => {
  process.env.NODECG_ROOT = tmpDir;

  // Dynamic import AFTER env var is set
  const bundleManagerModule = await import("./bundle-manager.js");
  BundleManager = bundleManagerModule.BundleManager;
});
```

### Layer.toRuntime for Test Setup

Creating a shared BundleManager instance across tests requires `Layer.toRuntime` with a shared scope:

```typescript
scope = Effect.runSync(Scope.make());
const runtime = await Effect.runPromise(
  Layer.toRuntime(BundleManagerLayer).pipe(Scope.extend(scope)),
);
bundleManagerInstance = runtime.context.unsafeMap.get(BundleManager.key);
```

### listenTo Returns Scoped Effect

The `listenTo` method returns `Effect<Stream, never, Scope>` because it creates a PubSub subscription. Consumers must wrap with `Effect.scoped`:

```typescript
const stream = await Effect.runPromise(
  bundleManager.listenTo("bundleChanged").pipe(Effect.scoped),
);
```

### ExtensionManager Decoupling

Rather than making ExtensionManager depend on BundleManager service, it accepts bundles array + removeBundle callback. This avoids Effect dependency in the class while maintaining the public event API.

### Stream.mergeAll Type Unification

When merging streams with different BundleEvent types for the bundles replicant update, map each to a common void type:

```typescript
const streams = yield* Effect.all([
  bundleManager.listenTo("ready").pipe(Effect.map(Stream.map(() => {}))),
  bundleManager.listenTo("bundleChanged").pipe(Effect.map(Stream.map(() => {}))),
  // ...
]);
Stream.mergeAll(streams, { concurrency: "unbounded" });
```

### Chunk.head for Stream Collection

Use `Chunk.head` (returns `Option`) instead of array indexing when collecting stream elements:

```typescript
const eventOption = await Effect.runPromise(
  stream.pipe(
    Stream.take(1),
    Stream.runCollect,
    Effect.map(Chunk.head),
  ),
);
expect(Option.isSome(eventOption)).toBe(true);
```
