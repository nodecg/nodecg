# Phase 3: Chokidar → Effect Wrapper

**Status**: ✅ Complete
**Complexity**: ⭐ Simple

## Overview

Create Effect-friendly wrapper for chokidar file watching API, built on reusable EventEmitter utilities. This provides type-safe file watching with automatic resource cleanup and Stream-based event processing for bundle-manager and assets modules.

## Goals

- Create Effect-friendly API wrapper for chokidar
- Type-safe file watching with automatic cleanup
- Stream-based event processing (add, change, unlink, etc.)
- Replace manual event handlers in bundle-manager and assets
- Establish patterns for file watching throughout the codebase

## Current Problem

Chokidar file watchers are used in multiple modules with manual event handling:

**bundle-manager.ts** - Module-level watcher for bundle changes:

```typescript
// Module-level watcher (difficult to manage lifecycle)
const watcher = chokidar.watch([], {
  // Empty array - paths added dynamically!
  persistent: true,
  ignoreInitial: true,
  followSymlinks: true,
  ignored: [/\/node_modules\//, /\/.+\.lock/],
});

// Manual event handlers with debouncing
watcher.on("add", (path) => {
  /* handle add */
});
watcher.on("change", (path) => {
  /* handle change with debounce */
});
watcher.on("unlink", (path) => {
  /* handle unlink */
});
watcher.on("error", (error) => {
  /* handle error */
});

// CRITICAL PATTERN: Dynamic path addition after bundle validation
const handleBundle = (bundlePath) => {
  const bundle = parseBundle(bundlePath); // Validate first
  bundles.push(bundle);

  // Add paths AFTER successful validation
  watcher.add([
    path.join(bundlePath, ".git"),
    path.join(bundlePath, "dashboard"),
    path.join(bundlePath, "package.json"),
  ]);
};

// Manual cleanup in tests
watcher.close();
```

**assets.ts** - Watcher for asset file changes:

```typescript
// Deferred file collection pattern
const deferredFiles: Map<string, string> = new Map();
let ready = false;

watcher.on("ready", () => {
  ready = true; /* process deferred */
});
watcher.on("add", (path, stats) => {
  if (!ready) {
    deferredFiles.set(path, hash);
  } else {
    updateReplicant(path);
  }
});
```

**Problems**:

- Manual resource management (no automatic cleanup)
- Module-level state (hard to test, no scoping)
- Complex manual patterns (debouncing, deferred collection)
- No type safety on event payloads
- Scattered cleanup logic (easy to forget)
- Empty initialization + dynamic paths (needs explicit support)

## Implemented Architecture

**Implementation**: `workspaces/nodecg/src/server/_effect/chokidar.ts`

Effect-friendly chokidar wrapper API:

```typescript
// Core watcher lifecycle
getWatcher(paths, options): Effect<FSWatcher, never, Scope>
waitForReady(watcher): Effect<FileEvent.ready>  // Returns tagged event

// Tagged event union (all listeners return variants of this)
type FileEvent = Data.TaggedEnum<{
  ready: object;
  add: { path: string; stats?: Stats };
  change: { path: string; stats?: Stats };
  addDir: { path: string; stats?: Stats };
  unlink: { path: string };
  unlinkDir: { path: string };
  error: { error: unknown };
}>

// Individual event streams (all return Effect<Stream<FileEvent>>)
listenToAdd(watcher): Effect<Stream<FileEvent.add>, never, Scope>
listenToChange(watcher): Effect<Stream<FileEvent.change>, never, Scope>
listenToAddDir(watcher): Effect<Stream<FileEvent.addDir>, never, Scope>
listenToUnlink(watcher): Effect<Stream<FileEvent.unlink>, never, Scope>
listenToUnlinkDir(watcher): Effect<Stream<FileEvent.unlinkDir>, never, Scope>
listenToError(watcher): Effect<Stream<FileEvent.error>, never, Scope>
```

**Built on**: `_effect/event-listener.ts` utilities (`waitForEvent`, `listenToEvent`)

**Key design decisions**:

- Uses `Effect.acquireRelease` for automatic watcher cleanup
- Transforms chokidar's multi-arg events `(path, stats?)` tuples → `{path, stats}` objects via destructuring
- Returns `Effect<Stream>` for eager listener registration (avoids race conditions)
- All listeners auto-cleanup when Scope closes
- Unified `FileEvent` tagged enum for consistent event types across all listeners
- Users compose their own stream combinations (no `listenToAll()`)
- Dynamic path management via direct watcher methods (no wrapper needed)

## Implementation Plan

### Step 1: Create EventEmitter Utilities ✅ (Foundation)

**Status**: ✅ Complete

**Purpose**: Foundation for chokidar wrapper - reusable utilities for any EventEmitter

**Files**: `_effect/event-listener.ts` + tests

**Utilities**:

- `waitForEvent<T>(eventEmitter, eventName)` - One-time event → Effect
- `listenToEvent<T>(eventEmitter, eventName)` - Continuous events → Effect<Stream>

See [Problems & Solutions](#problems--solutions) for implementation patterns learned.

### Step 2: Design & Implement Chokidar Wrapper (Main Work)

**Status**: ✅ Complete

**Files**: `_effect/chokidar.ts` + `_effect/chokidar.test.ts`

**Core implementation**:

- `getWatcher()` - Creates watcher with `Effect.acquireRelease` (auto-cleanup on scope close)
  - Uses `Effect.promise(() => watcher.close())` for async cleanup
- `waitForReady()` - Uses `waitForEvent(watcher, "ready")`, returns tagged `FileEvent.ready` event
- `listenToAdd/Change/AddDir/Unlink/UnlinkDir/Error()` - Transform multi-arg events to typed objects:
  ```typescript
  // Chokidar emits: (path: string, stats?: Stats)
  // Destructure tuple and wrap: {path, stats}
  listenToChokidarEvent(watcher, "add").pipe(
    Effect.andThen(
      Stream.map(([path, stats]) => fileEvent.add({ path, stats })),
    ),
  );
  ```
- `FileEvent` tagged enum - Unified event types for all listeners

**Design decisions**:

- **Skipped `listenToAll()`** - Too complex to be type-safe with proper narrowing
- **Skipped `addPaths/unwatchPaths()`** - Users can call `watcher.add()` / `watcher.unwatch()` directly
- Generic `listenToChokidarEvent` helper for consistent multi-arg event handling
- All listeners return same tagged union type for composability

**Test coverage** (using `@effect/platform` FileSystem):

- ✅ Watcher lifecycle (create, verify cleanup on scope close via `watcher.closed`)
- ✅ `waitForReady()` - Returns tagged ready event
- ✅ `listenToAdd()` - File creation events with path + stats
- ❌ Error events skipped - chokidar doesn't reliably emit errors for invalid paths

### Step 3: Update Documentation

- Update `strategy.md` Phase 3 to reference `03-chokidar-wrapper.md`
- Document chokidar wrapper patterns for future use in Phase 4

## Problems & Solutions

### EventEmitter Utilities (Step 1 - ✅ Complete)

**Status**: Implemented in `_effect/event-listener.ts`

**Key patterns established:**

- `waitForEvent()` - One-time events using `Effect.async` with `eventEmitter.once()`
- `listenToEvent()` - Continuous events via `Effect.gen` returning `Stream.fromQueue`
- Eager listener registration (setup runs when Effect is yielded, not when Stream is consumed)
- Listener setup must run in main fiber before forking stream consumption

**Critical learnings:**

- `Stream.async` is lazy (pull-based) - wrap in `Effect.gen` for eager setup
- `Effect.all` runs in whichever fiber it's yielded in - keep outside `Effect.forkScoped`
- `eventEmitter.once()` auto-removes listener - no manual cleanup needed

**See implementation**: `workspaces/nodecg/src/server/_effect/event-listener.ts` for full details.

### Chokidar Wrapper (Step 2 - ✅ Solved)

#### Problem 4: Chokidar Multi-Argument Events

**Issue**: Chokidar emits events with multiple arguments `(path: string, stats?: Stats)`, but generic `listenToEvent` returns the full tuple.

**Solution**: Use generic helper + Stream.map to destructure and wrap:

```typescript
// Generic helper - returns tuple as-is from listenToEvent
const listenToChokidarEvent = <K extends keyof FSWatcherEventMap>(
  watcher: FSWatcher,
  eventName: K,
) => listenToEvent<FSWatcherEventMap[K]>(watcher, eventName);

// Individual listeners destructure and wrap in tagged events
export const listenToAdd = (watcher: FSWatcher) =>
  listenToChokidarEvent(watcher, "add").pipe(
    Effect.andThen(
      Stream.map(([path, stats]) => fileEvent.add({ path, stats })),
    ),
  );
```

**Benefits**:

- Reuses generic `listenToEvent` utility
- Type-safe tuple destructuring
- Consistent tagged event types across all listeners

#### Problem 5: Async Watcher Close

**Issue**: `chokidar.close()` returns a Promise, not synchronous cleanup.

**Solution**: Use `Effect.promise()` in `Effect.acquireRelease`:

```typescript
export const getWatcher = (paths, options) =>
  Effect.acquireRelease(
    Effect.sync(() => watch(paths, options)),
    (watcher) => Effect.promise(() => watcher.close()),
  );
```

This ensures the watcher fully closes before the scope exits.

#### Decision: Skip `listenToAll()` and Path Wrappers

**Decision**: Don't implement `listenToAll()` or `addPaths/unwatchPaths()` wrappers.

**Rationale**:

- **`listenToAll()`** - Type narrowing becomes too complex with merged streams. Users can compose individual streams if needed.
- **`addPaths/unwatchPaths()`** - Thin wrappers around `watcher.add()` / `watcher.unwatch()` provide no value. Users can call watcher methods directly.

**Alternative**: Users compose streams as needed:

```typescript
const [addStream, changeStream] =
  yield * Effect.all([listenToAdd(watcher), listenToChange(watcher)]);

yield *
  Stream.merge(addStream, changeStream).pipe(
    Stream.runForEach((event) => handleEvent(event)),
  );
```

## Files Modified

**New files**:

- ✅ `_effect/event-listener.ts` + `_effect/event-listener.test.ts` - EventEmitter utilities
- ✅ `_effect/chokidar.ts` + `_effect/chokidar.test.ts` - Chokidar wrapper

**Future usage** (not part of this phase):

- `server/bundle-manager.ts` - Can replace module-level watcher with scoped Effect
- `server/assets.ts` - Can use chokidar wrapper for asset watching

## Testing Strategy

1. **Unit tests** - Test each utility function in isolation
2. **Integration tests** - Verify refactored code in server/index.ts works correctly
3. **E2E tests** - Ensure existing E2E tests still pass
4. **Manual testing** - Start server, verify no regressions

## Benefits

### Immediate

- Cleaner, more readable code in server/index.ts
- Reduced boilerplate (50+ lines → ~10 lines)
- Automatic cleanup (no memory leak risk)
- Type-safe event handling

### Long-term

- Reusable across entire codebase
- Foundation for Phase 4 (BundleManager migration)
- Establishes EventEmitter → Effect patterns
- Easier to migrate other EventEmitter-based code

## Risks

**Low risk** - Simple utilities, straightforward refactoring:

- EventEmitter is standard Node.js API
- Existing code already has manual event handling
- Just wrapping in reusable utilities
- No complex state management
- Easy to test

## Completion Summary

**Completed**:

- ✅ Created `_effect/event-listener.ts` with EventEmitter utilities
- ✅ Created `_effect/chokidar.ts` wrapper with tagged event types
- ✅ Added tests using `@effect/platform` FileSystem
- ✅ All tests passing, no type errors
- ✅ Documentation updated

**Not implemented** (by design):

- ❌ `listenToAll()` - Too complex for type-safe narrowing
- ❌ `addPaths/unwatchPaths()` - Users call watcher methods directly

**Status**: Ready for use in future phases (BundleManager, Assets)

## Chokidar Usage Patterns

### Pattern: BundleManager (Empty Init + Dynamic Paths)

Create watcher with empty paths, add dynamically after validation:

```typescript
const program = Effect.fn(function* () {
  // Start with empty array
  const watcher = yield* getWatcher([], {
    ignoreInitial: true,
    followSymlinks: true,
    ignored: [/\/node_modules\//],
  });

  // Set up individual event listeners
  const [addStream, changeStream, unlinkStream] = yield* Effect.all([
    listenToAdd(watcher),
    listenToChange(watcher),
    listenToUnlink(watcher),
  ]);

  // Merge streams and handle events
  yield* Effect.forkScoped(
    Stream.merge(addStream, Stream.merge(changeStream, unlinkStream)).pipe(
      Stream.runForEach((event) => handleFileChange(event.path)),
    ),
  );

  // Add paths dynamically after bundle validation
  for (const bundlePath of validatedBundles) {
    watcher.add([
      // Call watcher method directly
      path.join(bundlePath, ".git"),
      path.join(bundlePath, "dashboard"),
      path.join(bundlePath, "package.json"),
    ]);
  }
});

// Watcher automatically closes when scope exits
yield * Effect.scoped(program);
```

### Pattern: Assets (Paths Upfront + Ready Event)

Traditional pattern - provide paths upfront, wait for ready:

```typescript
const program = Effect.fn(function* () {
  const watcher = yield* getWatcher(assetPaths, {
    ignoreInitial: false,
  });

  // Wait for chokidar's ready event (returns tagged event)
  const readyEvent = yield* waitForReady(watcher);
  yield* Effect.log("Watcher ready", readyEvent._tag);

  const addStream = yield* listenToAdd(watcher);
  yield* Effect.forkScoped(
    addStream.pipe(
      Stream.runForEach((event) => Effect.log(`Asset added: ${event.path}`)),
    ),
  );
});

yield * Effect.scoped(program);
```

### Pattern: Multiple Event Streams

Handle different event types with individual streams:

```typescript
const program = Effect.fn(function* () {
  const watcher = yield* getWatcher(["./assets"]);

  const [addStream, changeStream, unlinkStream] = yield* Effect.all([
    listenToAdd(watcher),
    listenToChange(watcher),
    listenToUnlink(watcher),
  ]);

  // Option 1: Separate handlers for each event type
  yield* Effect.forkScoped(Stream.runForEach(addStream, handleAdd));
  yield* Effect.forkScoped(Stream.runForEach(changeStream, handleChange));
  yield* Effect.forkScoped(Stream.runForEach(unlinkStream, handleUnlink));

  // Option 2: Merge streams when shared handler
  yield* Effect.forkScoped(
    Stream.merge(addStream, Stream.merge(changeStream, unlinkStream)).pipe(
      Stream.runForEach((event) => handleFileChange(event)),
    ),
  );

  yield* waitForReady(watcher);
});
```

### Pattern: Dynamic Path Watching

Add paths to watcher after initialization:

```typescript
const program = Effect.fn(function* () {
  const watcher = yield* getWatcher([], { ignoreInitial: true });

  // Add paths dynamically using watcher methods
  watcher.add(["./bundle1/.git", "./bundle1/dashboard"]);
  watcher.add(["./bundle2/.git", "./bundle2/dashboard"]);

  const changeStream = yield* listenToChange(watcher);
  yield* Effect.forkScoped(changeStream.pipe(Stream.runForEach(handleChange)));
});
```
