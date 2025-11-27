# Phase 5: BundleManager (Effect.Service)

**Status**: PLANNED (prerequisite work complete)
**Complexity**: ⭐⭐⭐ Complex

## Overview

Replace the legacy class-based `BundleManager` with an Effect-based `BundleManager` service. The new implementation will use `Ref` for state management, `PubSub` for event broadcasting, and the chokidar wrapper from Phase 3 for file watching. Git parsing will be wrapped in Effect using `isomorphic-git`.

**Current State**: The legacy `BundleManager extends TypedEmitter` class remains in use at `src/server/server/bundle-manager.ts`. GitService has been implemented as a prerequisite.

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
      waitForReady: () => Effect.gen(function* () {
        const stream = yield* listenTo("ready");
        yield* stream.pipe(Stream.take(1), Stream.runDrain);
      }),
    };
  }),
  dependencies: [GitService.Default],
}) {}
```

### BundleEvent Tagged Union

```typescript
export type BundleEvent = Data.TaggedEnum<{
  ready: {};
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

Layer provided inside `createServer`, not at bootstrap level:
- Matches current timing (bundles loaded during server setup)
- Layer scope = server lifecycle
- Consumers inside server use `yield* BundleManager`

```typescript
// in createServer
const main = Effect.gen(function* () {
  const bundleManager = yield* BundleManager;
  // ... rest of server setup
}).pipe(
  Effect.provide(BundleManager.Default)
);
```

## Key Decisions

1. **Rewrite in place** - Keep `src/server/server/bundle-manager.ts` location, change implementation
2. **GitService separate** - Isolated in `_effect/git-service.ts` due to `isomorphic-git` side effects
3. **Generic `listenTo(tag)` method** - Single method with tag parameter, not individual `listenToBundleChanged()` etc.
4. **PubSub.unbounded** - Events are infrequent, subscriber queues bounded by consumption rate
5. **Ref for state** - Atomic updates, type-safe, scoped lifecycle
6. **Stream.debounce for timing** - Ready (1000ms with prepend), backoff (500ms via GroupBy.evaluate), git (250ms via GroupBy.evaluate)
7. **Layer inside createServer** - Bundles loaded during server setup, layer scope = server lifecycle

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

### 2. BundleManager Core

- [ ] Rewrite `bundle-manager.ts` in place
- [ ] Define `BundleEvent` tagged enum
- [ ] Implement `BundleManager` with:
  - `bundlesRef: Ref<Array<NodeCG.Bundle>>`
  - `events: PubSub<BundleEvent>`
  - `all()`: Read from Ref
  - `find(name)`: Read and filter from Ref
  - `remove(name)`: Remove bundle from Ref and publish event

### 3. File Watching

- [ ] Use `getWatcher` from `_effect/chokidar.ts`
- [ ] Merge `listenToAdd`, `listenToChange`, `listenToUnlink` streams
- [ ] Ready delay: `Stream.as(Tick())` + `Stream.prepend(Tick())` + `Stream.debounce("1000 millis")` + `Stream.take(1)`
- [ ] Route change/unlink events through change handler

### 4. Change Handling

- [ ] Group change events by bundle name (`Stream.groupByKey`)
- [ ] Apply `GroupBy.evaluate` with `Stream.debounce("500 millis")` per bundle for backoff
- [ ] 100ms delay before each reparse (`Effect.sleep("100 millis")`)
- [ ] Publish `bundleChanged` or `invalidBundle` after reparse

### 5. Git Change Handling

- [ ] Filter `.git` directory changes from file events
- [ ] Group by bundle name (`Stream.groupByKey`)
- [ ] Apply `GroupBy.evaluate` with `Stream.debounce("250 millis")` per bundle
- [ ] Call `GitService.getGitHead(bundlePath)` and update bundle in Ref
- [ ] Publish `gitChanged` event

### 6. Bootstrap Integration

- [ ] Provide `BundleManager.Default` layer in bootstrap.ts

### 7. Consumer Updates

- [ ] Update bootstrap to provide `BundleManager` layer
- [ ] Update server/index.ts to use `yield* BundleManager` pattern
- [ ] Update ExtensionManager to accept bundles array + removeBundle callback
- [ ] Remove direct BundleManager parameter passing from routers

_Note: "Already migrated" routers (listed below) currently use `Effect.fn` but still receive legacy `BundleManager` as a parameter. After this phase, they will use `yield* BundleManager` pattern instead._

### 8. Testing

- [x] Unit tests for git service
- [ ] Rewrite bundle-manager.test.ts for Effect-based API
- [ ] Adapt E2E test helpers to provide BundleManager layer
- [ ] Fix test setup with dynamic imports for NODECG_ROOT ordering

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

**Created** (prerequisite work):

- `src/server/_effect/git-service.ts` - GitService with isomorphic-git ✅
- `src/server/_effect/git-service.test.ts` - GitService tests ✅

**To be rewritten** (when implementation starts):

- `src/server/server/bundle-manager.ts` - Currently legacy class, will become Effect.Service
- `src/server/server/bundle-manager.test.ts` - Currently tests legacy class

**To be updated** (when implementation starts):

- `src/server/server/index.ts` - Will use service pattern
- `src/server/server/extensions.ts` - Will accept bundles array + removeBundle callback
- `src/server/bootstrap.ts` - Will provide BundleManager.Default layer
- `test/helpers/setup.ts` - Will provide BundleManager layer

**Already migrated** (consumers use Effect.fn with legacy BundleManager):

- `src/server/server/dashboard.ts`
- `src/server/server/graphics/index.ts`
- `src/server/server/graphics/registration.ts`
- `src/server/server/assets.ts`
- `src/server/server/sounds.ts`
- `src/server/server/mounts.ts`
- `src/server/server/shared-sources.ts`

## Lessons Learned

### isomorphic-git Branch Return Type

`isomorphic-git`'s `currentBranch()` returns `string | void`, not `string | undefined`. Use Effect's `Match` module for clean handling:

```typescript
const branch =
  yield *
  Effect.tryPromise({
    try: () => git.currentBranch({ fs: nodeFs, dir: bundlePath }),
    catch: (cause) => new GitBranchReadError({ path: bundlePath, cause }),
  }).pipe(
    Effect.map((branch) =>
      Match.value(branch).pipe(
        Match.when(Match.string, (b) => Option.some(b)),
        Match.orElse(() => Option.none()),
      ),
    ),
  );
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

_Note: Additional patterns will be documented when the BundleManager service migration is implemented._
