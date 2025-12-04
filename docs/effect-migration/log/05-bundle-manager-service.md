# Phase 5: BundleManager (Effect.Service)

**Status**: IN PROGRESS (implementation complete, tests broken)
**Complexity**: ⭐⭐⭐ Complex

## Overview

Replace the legacy class-based `BundleManager` with an Effect-based `BundleManager` service. The new implementation uses `PubSub` for event broadcasting, and the chokidar wrapper from Phase 3 for file watching.

**Current State**: `BundleManager` has been converted to `Effect.Service` with:
- All 4 timers migrated to Effect/Stream patterns
- `PubSub<BundleEvent>` for event broadcasting (replaces EventEmitter)
- `subscribe()` method returning `Effect<Stream<BundleEvent>>`
- `waitForReady()` using `Deferred`
- Layer provided in `createServer` via `Effect.provide(BundleManager.Default)`
- Consumer (`server/index.ts`) fully migrated to use service pattern

## Goals

- ✅ Create `BundleManager` using `Effect.Service` (scoped)
- ✅ Replace `EventEmitter` events with `PubSub<BundleEvent>`
- ✅ Use Phase 3 chokidar wrapper for file watching
- ✅ Preserve ready/debounce timing semantics
- ✅ Update consumers to use service interface
- ❌ Migrate tests to Effect-based API (BLOCKING)

**Note**: Original plan included `Ref<Array<NodeCG.Bundle>>` for state and `isomorphic-git` for git parsing. Implementation uses mutable array with closures (simpler for this use case) and retains existing `git-rev-sync` in `parseGit` (migration deferred).

## Current Architecture (Legacy)

**Module-level state** (`server/server/bundle-manager.ts`):

- `watcher`: Module-level chokidar instance
- `bundles: NodeCG.Bundle[]`: Mutable array
- `hasChanged: Set<string>`: Pending bundle names during backoff
- `backoffTimer: NodeJS.Timeout`: Debounce timer

### Legacy Timer Behavior (Detailed)

The original implementation uses **4 distinct timing mechanisms**:

#### 1. `readyTimeout` (1000ms debounced ready signal)

```typescript
const READY_WAIT_THRESHOLD = 1000;

const readyTimeout = setTimeout(() => {
    this._ready = true;
    this.emit("ready");
}, READY_WAIT_THRESHOLD);

// In watcher.on("add", ...):
if (!this.ready) {
    readyTimeout.refresh();
}
```

**Purpose**: Signals when initial bundle loading is complete (fires once after a period of inactivity).

**Behavior**:
- Timer created in constructor with 1000ms delay
- On each `watcher.on("add", ...)` event while not ready: `.refresh()` resets the 1000ms countdown
- Timer fires 1000ms after the LAST `add` event (or 1000ms after constructor if no `add` events)
- Once fired: sets `_ready = true`, emits `"ready"`, and never fires again
- After `_ready` becomes `true`, `add` events no longer call `.refresh()`

**Key**: This is a **debounce** pattern - fires once after 1000ms of no `add` activity. NOT a fixed 1000ms delay from constructor.

**Effect Implementation** ✅:

```typescript
const addStream = yield* listenToAdd(watcher).pipe(
  Effect.andThen(Stream.as(null)),
  Effect.andThen(Stream.prepend(Chunk.of(null))),
);
yield* Effect.forkScoped(
  addStream.pipe(
    Stream.debounce(Duration.seconds(1)),
    Stream.take(1),
    Stream.runDrain,
    Effect.andThen(() => emit("ready")),
  ),
);
```

`Stream.prepend` ensures the debounce fires even if no add events occur (initial element starts the timer). Each add event resets the debounce timer via the stream.

#### 2. `handleChange` initial delay (100ms)

```typescript
handleChange(bundleName: string): void {
    setTimeout(() => {
        this._handleChange(bundleName);
    }, 100);
}
```

**Purpose**: Small delay before processing any change to allow file system to settle.

**Behavior**: Every change request waits 100ms before `_handleChange` processes it.

**History**: Added in Aug 2017 ([e20bc5a2](https://github.com/nodecg/nodecg/commit/e20bc5a2)) as a band-aid to "reduce frequency of crash when editing dashboard HTML files". The crash occurred because editors doing atomic saves (write temp → rename) could leave files in a partial state when chokidar fired the change event. The proper fix (try/catch around `parseBundle`) was added 6 months later in Feb 2018 ([4d423359](https://github.com/nodecg/nodecg/commit/4d423359)), but the 100ms delay was never removed.

**Effect Implementation** ✅:

Replaced by chokidar's `awaitWriteFinish` option, which properly waits for file writes to complete before firing events:

```typescript
const watcher = yield* getWatcher([], {
  awaitWriteFinish: true,  // waits for file size to stabilize (default: 2000ms)
  // ...
});
```

This solves the problem at the source rather than with a downstream setTimeout hack.

#### 3. `backoffTimer` (500ms coalescing timer)

```typescript
resetBackoffTimer(): void {
    clearTimeout(backoffTimer);
    backoffTimer = setTimeout(() => {
        backoffTimer = undefined;
        for (const bundleName of hasChanged) {
            this.handleChange(bundleName);  // Goes back through 100ms delay
        }
        hasChanged.clear();
    }, 500);
}
```

**Purpose**: Coalesce rapid file changes to avoid re-parsing bundles repeatedly.

**Behavior in `_handleChange`**:
```
if (backoffTimer active) {
    → Add bundleName to hasChanged set
    → Reset the 500ms timer (extends the backoff)
} else {
    → Process the change immediately
    → Start a new 500ms backoff timer
}
```

**Key insight**: The first change processes immediately and starts backoff. Subsequent changes within 500ms are queued in `hasChanged` and processed after backoff expires.

**Effect Implementation** ✅:

Unified stream architecture using `Stream.groupByKey` + `GroupBy.evaluate` with per-bundle debouncing:

```typescript
const fileChangeHandler = Stream.mergeAll([addStream, changeStream, unlinkStream], { concurrency: "unbounded" }).pipe(
  Stream.filterMap(({ path: filePath, _tag }) => {
    const bundleName = findBundleName(bundleRootPaths, filePath);
    if (!bundleName) return Option.none();
    const bundle = find(bundleName);
    if (!bundle) return Option.none();
    return Option.some({ _tag, bundleName, filePath, bundle });
  }),
  Stream.groupByKey(({ bundleName }) => bundleName),
  GroupBy.evaluate((_, stream) =>
    stream.pipe(
      Stream.groupByKey(({ _tag, bundleName, filePath }) => {
        if (_tag === "change" && isManifest(bundleName, filePath)) return "parseBundle";
        if (isPanelHTMLFile(bundleName, filePath)) return "parseBundle";
        if (isGitData(bundleName, filePath)) return "parseGit";
        return "noop";
      }),
      GroupBy.evaluate((key, stream) =>
        Match.value(key).pipe(
          Match.when("parseBundle", () =>
            stream.pipe(
              Stream.debounce(Duration.millis(500)),
              Stream.mapEffect(({ bundle }) => parseBundleAndEmit(bundle)),
            ),
          ),
          Match.when("parseGit", () =>
            stream.pipe(
              Stream.debounce(Duration.millis(250)),
              Stream.mapEffect(({ bundle }) => gitChangeHandler(bundle)),
            ),
          ),
          Match.when("noop", () => Stream.void),
          Match.exhaustive,
        ),
      ),
    ),
  ),
);
yield* Effect.forkScoped(fileChangeHandler.pipe(Stream.runDrain));
```

The nested `Stream.groupByKey` creates two levels of grouping:
1. First by bundle name (all events for same bundle go to same sub-stream)
2. Then by event type (`parseBundle`, `parseGit`, `noop`)

Each typed sub-stream gets its own debounce timer (500ms for bundle parsing, 250ms for git).

#### 4. `_debouncedGitChangeHandler` (250ms lodash debounce)

```typescript
private readonly _debouncedGitChangeHandler = debounce((bundleName) => {
    const bundle = this.find(bundleName);
    if (!bundle) return;
    bundle.git = parseBundleGit(bundle.dir);
    this.emit("gitChanged", bundle);
}, 250);
```

**Purpose**: Git data changes often come in bursts (multiple .git files modified during commit/checkout); debounce to single update.

**Effect Implementation** ✅:

Handled by the unified stream architecture above. The `gitChangeHandler` is now an `Effect.fn`:

```typescript
const gitChangeHandler = Effect.fn("gitChangeHandler")(function* (bundle: NodeCG.Bundle) {
  bundle.git = parseBundleGit(bundle.dir);
  emit("gitChanged", bundle);
});
```

Git changes are routed to the `"parseGit"` branch which applies `Stream.debounce(Duration.millis(250))` before calling `gitChangeHandler`.

#### Timeline Example

When `bundle-a` has 3 files change rapidly:

```
T=0ms:    File1 changes → handleChange("bundle-a")
T=100ms:  _handleChange runs → no backoff active → processes immediately, starts 500ms backoff
T=150ms:  File2 changes → handleChange("bundle-a")
T=250ms:  _handleChange runs → backoff IS active → adds to hasChanged, resets timer to T+500ms=750ms
T=300ms:  File3 changes → handleChange("bundle-a")
T=400ms:  _handleChange runs → backoff active → adds to hasChanged (already there), resets to T+500ms=900ms
T=900ms:  Backoff expires → processes hasChanged entries → handleChange("bundle-a")
T=1000ms: _handleChange runs → no backoff → processes, starts new 500ms backoff
```

**Result**: First change processed immediately, subsequent rapid changes coalesced into one processing after 500ms of quiet.

#### Summary Table

| Timer | Duration | Pattern | Resets On | Purpose | Effect |
|-------|----------|---------|-----------|---------|--------|
| `readyTimeout` | 1000ms | Debounce (fires once after inactivity) | Each `add` event (while not ready) | Signal initial load complete | ✅ `Stream.prepend` + `Stream.debounce` |
| `handleChange` delay | 100ms | Fixed delay per call | N/A (new timer each call) | Allow filesystem to settle | ✅ `awaitWriteFinish: true` (chokidar) |
| `backoffTimer` | 500ms | Debounce with queue | Each change during backoff | Coalesce rapid changes | ✅ `Stream.groupByKey` + `Stream.debounce` |
| `gitChangeHandler` | 250ms | Lodash debounce | Each `.git` file change | Coalesce git operations | ✅ `Stream.groupByKey` + `Stream.debounce` |

**Events emitted**:

- `ready`: Initial scan complete
- `bundleChanged`: Bundle reparsed successfully
- `invalidBundle`: Bundle reparse failed
- `bundleRemoved`: Bundle removed from list
- `gitChanged`: Git metadata updated

## Target Architecture

### BundleManager Service (`src/server/server/bundle-manager.ts` - implemented)

See [actual implementation](../../workspaces/nodecg/src/server/server/bundle-manager.ts) for full details.

**Service Interface**:
```typescript
{
  find: (name: string) => NodeCG.Bundle | undefined;
  all: () => NodeCG.Bundle[];
  remove: (bundleName: string) => Effect<void>;
  subscribe: () => Effect<Stream<BundleEvent>>;
  waitForReady: () => Effect<void>;
}
```

**Key implementation choices**:
- Mutable `bundles` array with closures (simpler than `Ref` for this use case)
- `subscribe()` returns full event stream; consumers filter by `_tag`
- `waitForReady()` uses `Deferred.await` (simpler than stream-based approach)
- No `dependencies` option (reads config from existing module imports)

### BundleEvent Tagged Union

```typescript
export type BundleEvent = Data.TaggedEnum<{
  bundleChanged: { bundle: NodeCG.Bundle };
  invalidBundle: { bundle: NodeCG.Bundle; error: unknown };
  bundleRemoved: { bundleName: string };
  gitChanged: { bundle: NodeCG.Bundle };
}>;
```

**Note**: `ready` event removed from tagged union - uses `Deferred` instead.

### GitService Interface

See actual implementation: [src/server/\_effect/git-service.ts](../../workspaces/nodecg/src/server/_effect/git-service.ts)

- `getGitHead(bundlePath)` - Returns `Effect<Option<GitHeadData>, GitError>`
- `GitHeadData`: `{ hash, shortHash, date, message, branch: Option<string> }`
- Error types: `GitBranchReadError`, `GitHeadReadError`, `GitDateParseError`
- Dependencies: `FileSystem.FileSystem`, `Path.Path` via `dependencies` option

**Note**: GitService is implemented but not yet used in BundleManager. The existing `parseBundleGit()` function (using `git-rev-sync`) is retained for now.

### Debounce/Backoff Implementation (Implemented)

Uses Effect's Stream APIs for timing control:

- **Ready delay**: `Stream.prepend` + `Stream.debounce(Duration.seconds(1))` + `Stream.take(1)` + `Deferred.succeed`
- **File write settling**: `awaitWriteFinish: true` in chokidar options
- **Backoff**: Nested `Stream.groupByKey` + `GroupBy.evaluate` with `Stream.debounce(Duration.millis(500))` per bundle
- **Git debounce**: Same architecture with `Stream.debounce(Duration.millis(250))`

### Layer Provision

Layer provided inside `createServer` via `Effect.provide(BundleManager.Default)`:
- Layer scope = server lifecycle
- Consumer uses `yield* BundleManager`

```typescript
// in createServer (server/index.ts)
export const createServer = Effect.fn("createServer")(function* () {
  const bundleManager = yield* BundleManager;
  // ... rest of server setup
}, Effect.provide(BundleManager.Default));
```

## Key Decisions

1. **Rewrite in place** - Keep `src/server/server/bundle-manager.ts` location, change implementation ✅
2. **GitService separate** - Isolated in `_effect/git-service.ts` (implemented but not yet wired to BundleManager)
3. **Simple subscribe() method** - Returns full event stream; consumers filter by `_tag` (simpler than generic `listenTo(tag)`)
4. **PubSub.unbounded** - Events are infrequent, subscriber queues bounded by consumption rate ✅
5. **Mutable array with closures** - Simpler than `Ref` for this use case (no concurrent access concerns)
6. **Stream.debounce for timing** - Ready (1000ms with prepend), backoff (500ms via GroupBy.evaluate), git (250ms via GroupBy.evaluate); file write settling via `awaitWriteFinish: true` ✅
7. **Layer inside createServer** - Bundles loaded during server setup, layer scope = server lifecycle ✅
8. **Deferred for ready signal** - Simpler than stream-based `listenTo("ready")` pattern ✅

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

- [x] Rewrite `bundle-manager.ts` as `Effect.Service`
- [x] Define `BundleEvent` tagged enum
- [x] Implement `PubSub<BundleEvent>` for event broadcasting
- [x] Implement `all()`: Returns shallow clone of bundles array
- [x] Internal `find(name)`, `add(bundle)`, `remove(bundleName)` functions
- [x] `subscribe()` method returning `Effect<Stream<BundleEvent>>`
- [x] `waitForReady()` using `Deferred`

### 3. File Watching ✅

- [x] Use `getWatcher` from `_effect/chokidar.ts`
- [x] Merge `listenToAdd`, `listenToChange`, `listenToUnlink` streams
- [x] Ready delay: `Stream.prepend` + `Stream.debounce(1s)` + `Stream.take(1)`
- [x] `awaitWriteFinish: true` for file write settling

### 4. Change Handling ✅

- [x] Group change events by bundle name (`Stream.groupByKey`)
- [x] Apply `GroupBy.evaluate` with `Stream.debounce(500ms)` per bundle
- [x] Inner grouping by event type (`parseBundle`, `parseGit`, `noop`)
- [x] `parseBundleAndEmit` handles reparse and emits events

### 5. Git Change Handling ✅

- [x] Filter `.git` directory changes via `isGitData()` check
- [x] Group by bundle name (nested in same stream architecture)
- [x] Apply `Stream.debounce(250ms)` per bundle for git changes
- [x] `gitChangeHandler` as `Effect.fn` updates bundle git data

### 6. Bootstrap Integration ✅

- [x] Layer provided in `createServer` via `Effect.provide(BundleManager.Default)` (not bootstrap.ts)

### 7. Consumer Updates ✅

- [x] server/index.ts uses `yield* BundleManager` pattern
- [x] server/index.ts subscribes to events via `bundleManager.subscribe()`
- [x] Routers receive `bundleManager.all()` result (not full service)
- [x] ExtensionManager receives bundles from `bundleManager.all()` + uses `createExtensionManager` pattern

_Note: Routers now receive bundle arrays directly. Only server/index.ts interacts with the full BundleManager service._

### 8. Testing

- [x] Unit tests for git service
- [ ] Rewrite bundle-manager.test.ts for Effect-based API (tests still use legacy class API)

### 9. Cleanup (Deferred)

- [ ] Wire GitService to BundleManager (currently uses `parseBundleGit` from `git-rev-sync`)
- [ ] Remove `git-rev-sync` from dependencies

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
- `src/server/_effect/nodecg-package-json.ts` - NodecgPackageJson service ✅

**Rewritten** (complete):

- `src/server/server/bundle-manager.ts` - Full `Effect.Service` with PubSub events ✅

**Updated** (complete):

- `src/server/server/index.ts` - Uses `yield* BundleManager`, subscribes to events ✅

**Pending**:

- `src/server/server/bundle-manager.test.ts` - Still tests legacy class API, needs rewrite for Effect-based API

**No changes needed** (routers receive bundle arrays, not BundleManager service):

- `src/server/server/dashboard.ts` - Receives `BundleManager` service (for `find` method)
- `src/server/server/graphics/index.ts` - Does not use BundleManager
- `src/server/server/graphics/registration.ts` - Does not use BundleManager
- `src/server/server/assets.ts` - Receives `bundles: NodeCG.Bundle[]`
- `src/server/server/sounds.ts` - Receives `bundles: NodeCG.Bundle[]`
- `src/server/server/mounts.ts` - Receives `bundles: NodeCG.Bundle[]`
- `src/server/server/shared-sources.ts` - Receives `bundles: NodeCG.Bundle[]`

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

### Nested Stream.groupByKey for Multi-Level Debouncing

When multiple debounce timers need to operate on the same event stream but with different durations based on event type, use nested `Stream.groupByKey` + `GroupBy.evaluate`:

```typescript
stream.pipe(
  Stream.groupByKey(event => event.bundleName),  // First: group by bundle
  GroupBy.evaluate((_, bundleStream) =>
    bundleStream.pipe(
      Stream.groupByKey(event => categorize(event)),  // Second: group by category
      GroupBy.evaluate((category, categoryStream) =>
        Match.value(category).pipe(
          Match.when("parseBundle", () => categoryStream.pipe(Stream.debounce(Duration.millis(500)), ...)),
          Match.when("parseGit", () => categoryStream.pipe(Stream.debounce(Duration.millis(250)), ...)),
          Match.when("noop", () => Stream.void),
          Match.exhaustive,
        ),
      ),
    ),
  ),
);
```

This creates independent debounce timers per (bundleName, category) combination.

### Deferred for One-Time Ready Signal

When a service needs to signal "ready" exactly once, `Deferred` is simpler than streaming:

```typescript
const ready = yield* Deferred.make();

// In stream handler (fires after debounce)
yield* addStream.pipe(
  Stream.debounce(Duration.seconds(1)),
  Stream.take(1),
  Stream.runDrain,
  Effect.andThen(() => Deferred.succeed(ready, undefined)),
  Effect.forkScoped,
);

// Consumer waits
const waitForReady = () => Deferred.await(ready);
```

No need for `PubSub` or event filtering when the signal only fires once.

### Mutable Array vs Ref for Service State

When state is only accessed synchronously within a single Effect scope and no concurrent updates occur, a mutable array with closures is simpler than `Ref`:

```typescript
// Simple pattern - direct mutation via closures
const bundles: NodeCG.Bundle[] = [];
const all = () => bundles.slice(0);
const add = (bundle: NodeCG.Bundle) => { bundles.push(bundle); };
```

Use `Ref` when:
- Concurrent access from multiple fibers
- Need atomic read-modify-write operations
- State needs to be accessed outside the service scope
