# Phase 5: BundleService Migration

**Status**: Planned
**Complexity**: ⭐⭐⭐ Complex

## Overview

Replace the legacy class-based `BundleManager` with an Effect-based `BundleService`. The service will use `Ref` for state management, `PubSub` for event broadcasting, and the chokidar wrapper from Phase 3 for file watching. Git parsing will be wrapped in Effect using `isomorphic-git`.

## Goals

- Create `BundleService` using `Effect.Service` (no classes)
- Replace module-level state with scoped `Ref<Array<NodeCG.Bundle>>`
- Replace `EventEmitter` events with `PubSub<BundleEvent>`
- Use Phase 3 chokidar wrapper for file watching
- Wrap git parsing in Effect (replace `git-rev-sync` with `isomorphic-git`)
- Preserve ready/debounce timing semantics
- Update consumers to use service interface

## Current Architecture (Legacy)

**Module-level state** (`bundle-manager.ts`):

- `watcher`: Module-level chokidar instance
- `bundles: NodeCG.Bundle[]`: Mutable array
- `hasChanged: Set<string>`: Pending bundle names during backoff
- `backoffTimer: NodeJS.Timeout`: Debounce timer

**Timing behavior**:

- Ready delay: 1000ms after last `add` event (`READY_WAIT_THRESHOLD`)
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

### BundleService Interface

```typescript
export class BundleService extends Effect.Service<BundleService>()("BundleService", {
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

    return {
      all: Effect.fn(function* () { return yield* Ref.get(bundlesRef); }),
      find: Effect.fn(function* (name: string) { ... }),
      events,
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
        // Return GitData | undefined (undefined if no .git directory)
      }),
    };
  }),
}) {}
```

### Debounce/Backoff Implementation

Use Effect's Stream APIs for timing control:

- **Ready delay**: `Stream.debounce("1000 millis")` on add events, then `Stream.take(1)`
- **Change handling**: 100ms delay via `Effect.sleep("100 millis")` before reparse
- **Backoff**: `Stream.debounce("500 millis")` on change events per bundle
- **Git debounce**: `Stream.debounce("250 millis")` on .git file changes per bundle

```typescript
// Ready event fires after 1000ms of no add events
addStream.pipe(
  Stream.debounce("1000 millis"),
  Stream.take(1),
  Stream.runForEach(() => PubSub.publish(events, bundleEvent.ready())),
)
```

### Initial Bundle Loading

Bundles loaded synchronously during `scoped` initialization (same as current behavior).

## Key Decisions

1. **No facade over legacy code** - Full rewrite, not a wrapper around BundleManager
2. **GitService as Effect.Service** - Full service wrapping `isomorphic-git`, no `process.chdir()` side effects
3. **PubSub for broadcasting** - Multiple consumers can subscribe independently
4. **Ref for state** - Atomic updates, type-safe, scoped lifecycle
5. **Stream.debounce for timing** - Ready (1000ms), backoff (500ms), git (250ms)
6. **Sync initial loading** - Bundles loaded during `scoped` initialization

## Implementation Plan

### 1. GitService (Effect.Service)

- [ ] Create `git-service.ts` as full `Effect.Service`
- [ ] Implement `parseGit(bundlePath)` returning `Effect<GitData | undefined>`
- [ ] Use `isomorphic-git` for branch, hash, date, message, shortMessage
- [ ] Handle missing `.git` directory gracefully (return undefined)
- [ ] Remove `git-rev-sync` dependency

### 2. BundleService Core

- [ ] Create `bundle-service.ts`
- [ ] Define `BundleEvent` tagged enum
- [ ] Implement `BundleService` with:
  - `bundlesRef: Ref<Array<NodeCG.Bundle>>`
  - `events: PubSub<BundleEvent>`
  - `all()`: Read from Ref
  - `find(name)`: Read and filter from Ref

### 3. File Watching

- [ ] Use `getWatcher` from `_effect/chokidar.ts`
- [ ] Merge `listenToAdd`, `listenToChange`, `listenToUnlink` streams
- [ ] Ready delay: `Stream.debounce("1000 millis")` + `Stream.take(1)` on add events
- [ ] Route change/unlink events through change handler

### 4. Change Handling

- [ ] Group change events by bundle name (`Stream.groupByKey`)
- [ ] Apply `Stream.debounce("500 millis")` per bundle for backoff
- [ ] 100ms delay before each reparse (`Effect.sleep("100 millis")`)
- [ ] Publish `bundleChanged` or `invalidBundle` after reparse

### 5. Git Change Handling

- [ ] Filter `.git` directory changes from file events
- [ ] Group by bundle name (`Stream.groupByKey`)
- [ ] Apply `Stream.debounce("250 millis")` per bundle
- [ ] Call `GitService.parseGit(bundlePath)` and update bundle in Ref
- [ ] Publish `gitChanged` event

### 6. Bootstrap Integration

```typescript
// In bootstrap.ts
// BundleService depends on GitService via `dependencies` option
const program = mainEffect.pipe(Effect.provide(BundleService.Default));
```

### 7. Consumer Updates

- [ ] Update bootstrap to provide `BundleService` layer
- [ ] Replace `bundleManager.all()` with `yield* BundleService.pipe(Effect.andThen(s => s.all()))`
- [ ] Replace `listenToEvent(bundleManager, ...)` with `Stream.fromPubSub(events).pipe(Stream.filter(...))`
- [ ] Remove direct BundleManager imports

### 8. Testing

- [ ] Unit tests for git service
- [ ] Unit tests for debounce/backoff timing
- [ ] Integration tests for file change detection
- [ ] Adapt E2E test helpers to provide BundleService layer

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

**New files**:

- `src/server/_effect/git-service.ts`
- `src/server/_effect/bundle-service.ts`

**Modify**:

- `src/server/bootstrap.ts` - Provide layer
- `src/server/dashboard/index.ts` - Use service
- `src/server/graphics/index.ts` - Use service
- `src/server/assets.ts` - Use service
- `src/server/sounds.ts` - Use service
- `src/server/mounts.ts` - Use service
- `src/server/shared-sources.ts` - Use service
- `src/server/util/sentry-config.ts` - Use service

**Delete**:

- `src/server/bundle-manager.ts`
