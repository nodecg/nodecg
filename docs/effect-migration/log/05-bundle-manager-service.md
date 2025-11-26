# Phase 5: BundleManager (Effect.Service)

**Status**: Planned
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

```typescript
export class GitService extends Effect.Service<GitService>()("GitService", {
  effect: Effect.gen(function* () {
    return {
      parseGit: Effect.fn(function* (bundlePath: string) {
        // Use isomorphic-git to get branch, hash, date, message, shortMessage
        // Return Option<GitData> (Option.none() if no .git directory)
      }),
    };
  }),
}) {}
```

### Debounce/Backoff Implementation

Use Effect's Stream APIs for timing control:

- **Ready delay**: Prepend initial tick + `Stream.debounce("1000 millis")` to match `setTimeout.refresh()` semantics
- **Change handling**: 100ms delay via `Effect.sleep("100 millis")` before reparse
- **Backoff**: `Stream.groupByKey` + `GroupBy.evaluate` with `Stream.debounce("500 millis")` per bundle
- **Git debounce**: `Stream.groupByKey` + `GroupBy.evaluate` with `Stream.debounce("250 millis")` per bundle

```typescript
// Tick marker for timing (no payload needed)
interface Tick { readonly _tag: "Tick" }
const Tick = Data.tagged<Tick>("Tick")

// BundleEvent constructor
const bundleEvent = Data.taggedEnum<BundleEvent>()

// Ready event fires 1000ms after last add event, or initial 1000ms if no adds
// Prepending a tick ensures debounce fires even with zero add events
addStream.pipe(
  Stream.as(Tick()),
  Stream.prepend(Chunk.of(Tick())),
  Stream.debounce("1000 millis"),
  Stream.take(1),
  Stream.runDrain,
  Effect.andThen(() => PubSub.publish(events, bundleEvent.ready())),
)

// Per-bundle change debouncing with GroupBy.evaluate
changeStream.pipe(
  Stream.groupByKey((event) => getBundleName(event.path)),
  GroupBy.evaluate((bundleName, stream) =>
    stream.pipe(
      Stream.debounce("500 millis"),
      Stream.runForEach(() => handleBundleChange(bundleName)),
    )
  ),
  Stream.runDrain,
)
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

### 1. GitService (Effect.Service)

- [ ] Create `git-service.ts` as full `Effect.Service`
- [ ] Implement `parseGit(bundlePath)` returning `Effect<Option<GitData>>`
- [ ] Use `isomorphic-git` for branch, hash, date, message
- [ ] Handle missing `.git` directory gracefully (return `Option.none()`)
- [ ] Add tests
- [ ] Remove `git-rev-sync` dependency (after BundleManager migration)

### 2. BundleManager Core

- [ ] Rewrite `bundle-manager.ts` in place
- [ ] Define `BundleEvent` tagged enum
- [ ] Implement `BundleManager` with:
  - `bundlesRef: Ref<Array<NodeCG.Bundle>>`
  - `events: PubSub<BundleEvent>`
  - `all()`: Read from Ref
  - `find(name)`: Read and filter from Ref

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
- [ ] Call `GitService.parseGit(bundlePath)` and update bundle in Ref
- [ ] Publish `gitChanged` event

### 6. Bootstrap Integration

```typescript
// In bootstrap.ts
// BundleManager depends on GitService via `dependencies` option
const program = mainEffect.pipe(Effect.provide(BundleManager.Default));
```

### 7. Consumer Updates

Pattern change from parameter injection to service access:

```typescript
// Before
const router = Effect.fn(function* (bundleManager: BundleManager) {
  const stream = yield* listenToEvent<[]>(bundleManager, "bundleChanged");
  yield* Effect.forkScoped(stream.pipe(Stream.runForEach(...)));
  bundleManager.all().forEach(...)
});

// After
const router = Effect.fn(function* () {
  const bundleManager = yield* BundleManager;
  const stream = yield* bundleManager.listenTo("bundleChanged");
  yield* Effect.forkScoped(stream.pipe(Stream.runForEach(...)));
  const bundles = yield* bundleManager.all();
  bundles.forEach(...)
});
```

- [ ] Update bootstrap to provide `BundleManager` layer
- [ ] Update all consumer files to use `yield* BundleManager` pattern
- [ ] Remove direct BundleManager imports and parameter passing

### 8. Testing

- [ ] Unit tests for git service
- [ ] Unit tests for debounce/backoff timing
- [ ] Integration tests for file change detection
- [ ] Adapt E2E test helpers to provide BundleManager layer

### 9. Cleanup

- [ ] Remove legacy `bundle-manager.ts`
- [ ] Remove `git-rev-sync` from dependencies
- [ ] Update CLAUDE.md if needed

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

## Files to Create/Modify

**Create**:

- `src/server/_effect/git-service.ts` - GitService with isomorphic-git

**Rewrite in place**:

- `src/server/server/bundle-manager.ts` - BundleManager as Effect.Service

**Update consumers**:

- `src/server/server/index.ts` - Remove instantiation, provide layer
- `src/server/server/dashboard.ts`
- `src/server/server/graphics/index.ts`
- `src/server/server/graphics/registration.ts`
- `src/server/server/extensions.ts`
- `src/server/server/assets.ts`
- `src/server/server/sounds.ts`
- `src/server/server/mounts.ts`
- `src/server/server/shared-sources.ts`
- `src/server/server/sentry-config.ts`
- `src/server/bootstrap.ts` - Layer provision
