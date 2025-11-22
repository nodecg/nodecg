# Phase 3: EventEmitter → Effect Utilities

**Status**: In Progress
**Complexity**: ⭐ Simple

## Overview

Create general-purpose utilities for integrating Node.js EventEmitter with Effect, then refactor existing event listener patterns throughout the codebase. This establishes reusable patterns for EventEmitter integration and provides foundation for Phase 4 (BundleManager migration).

## Goals

- Create reusable EventEmitter → Effect integration utilities
- Eliminate repeated event listener + cleanup patterns
- Clean up existing event listeners in `server/index.ts`
- Establish patterns for future EventEmitter migrations
- Type-safe event handling with automatic cleanup

## Current Problem

Repeated pattern throughout codebase (server/index.ts has 4+ instances):

```typescript
// Lines 114-124: Server error listener
const waitForError = yield* Effect.forkScoped(
  Effect.async<never, UnknownError>((resume) => {
    const errorHandler = (err: unknown) => {
      resume(Effect.fail(new UnknownError(err)));
    };
    server.on("error", errorHandler);
    return Effect.sync(() => {
      server.removeListener("error", errorHandler);
    });
  }),
);

// Lines 125-135: Server close listener
const waitForClose = yield* Effect.forkScoped(
  Effect.async<void>((resume) => {
    const closeHandler = () => {
      resume(Effect.void);
    };
    server.on("close", closeHandler);
    return Effect.sync(() => {
      server.removeListener("close", closeHandler);
    });
  }),
);

// Lines 268-286: BundleManager ready event
yield* Effect.async<void>((resume) => {
  if (bundleManager.ready) {
    resume(Effect.void);
    return;
  }
  const succeed = () => {
    resume(Effect.void);
  };
  bundleManager.once("ready", succeed);
  return Effect.sync(() => {
    bundleManager.removeListener("ready", succeed);
  });
});

// Lines 399-402: BundleManager event listeners (not in Effect yet)
bundleManager.on("ready", updateBundlesReplicant);
bundleManager.on("bundleChanged", updateBundlesReplicant);
bundleManager.on("gitChanged", updateBundlesReplicant);
bundleManager.on("bundleRemoved", updateBundlesReplicant);
```

**Problems**:
- Verbose, repetitive boilerplate
- Easy to forget cleanup (memory leak risk)
- No type safety on event names/payloads
- Inconsistent patterns across codebase

## Target Architecture

**Implementation**: `workspaces/nodecg/src/server/_effect/event-listener.ts`

Two utilities created:

```typescript
// Wait for single event to fire once
waitForEvent<T>(eventEmitter: EventEmitterLike<[NoInfer<T>]>, eventName: string): Effect<T>

// Convert single event to continuous stream
listenToEvent<T>(eventEmitter: EventEmitterLike<[NoInfer<T>]>, eventName: string): Effect<Stream<T>>
```

**Key differences from original plan**:
- Uses `EventEmitterLike<T>` interface instead of `EventEmitter` for broader compatibility
- `listenToEvent` returns `Effect<Stream<T>>` (not bare `Stream`) for eager listener registration
- `listenToEvent` handles single event (not multiple events with names)
- To listen to multiple event types, use `Effect.all` + `Stream.mergeAll`
- Uses `Queue.bounded` + `Stream.fromQueue` pattern for stream construction
- Uses `Effect.addFinalizer` for cleanup (not `Stream.async` cleanup)

## Implementation Plan

### Step 1: Create EventEmitter Utilities ✅

**Status**: ✅ Complete

**Files created**:
- `workspaces/nodecg/src/server/_effect/event-listener.ts` - Utilities implementation
- `workspaces/nodecg/src/server/_effect/event-listener.test.ts` - Unit tests

**Utilities implemented**:
- `waitForEvent<T>(eventEmitter, eventName)` - Wait for single event → Effect<T>
- `listenToEvent<T>(eventEmitter, eventName)` - Continuous event stream → Effect<Stream<T>>

**Features delivered**:
- Generic type parameters for event data
- Automatic cleanup using `Effect.addFinalizer`
- `EventEmitterLike<T>` interface for broad compatibility (EventEmitter, BundleManager, etc.)
- Eager listener registration (setup runs immediately when Effect is yielded)
- Comprehensive unit tests with cleanup verification

### Step 2: Refactor server/index.ts Event Listeners

**Current locations to refactor**:

1. **Lines 114-124**: Server error listener
```typescript
// Before (14 lines)
const waitForError = yield* Effect.forkScoped(
  Effect.async<never, UnknownError>((resume) => {
    const errorHandler = (err: unknown) => {
      resume(Effect.fail(new UnknownError(err)));
    };
    server.on("error", errorHandler);
    return Effect.sync(() => {
      server.removeListener("error", errorHandler);
    });
  }),
);

// After (4 lines) - using listenToEvent for continuous error stream
const errorStream = yield* listenToEvent<Error>(server, "error");
yield* Effect.forkScoped(
  Stream.runForEach(errorStream, (err) => Effect.fail(new UnknownError(err)))
);
```

2. **Lines 125-135**: Server close listener
```typescript
// Before (12 lines)
const waitForClose = yield* Effect.forkScoped(
  Effect.async<void>((resume) => {
    const closeHandler = () => {
      resume(Effect.void);
    };
    server.on("close", closeHandler);
    return Effect.sync(() => {
      server.removeListener("close", closeHandler);
    });
  }),
);

// After (1 line) - using waitForEvent for one-time event
yield* Effect.forkScoped(waitForEvent(server, "close"));
```

3. **Lines 268-286**: BundleManager ready event
```typescript
// Before (19 lines)
yield* Effect.async<void>((resume) => {
  if (bundleManager.ready) {
    resume(Effect.void);
    return;
  }
  const succeed = () => {
    resume(Effect.void);
  };
  bundleManager.once("ready", succeed);
  return Effect.sync(() => {
    bundleManager.removeListener("ready", succeed);
  });
}).pipe(
  Effect.timeoutFail({
    duration: "15 seconds",
    onTimeout: () => new FileWatcherReadyTimeoutError(),
  }),
);

// After (7 lines) - using waitForEvent with conditional check
yield* (bundleManager.ready
  ? Effect.void
  : waitForEvent(bundleManager, "ready")
).pipe(
  Effect.timeoutFail({
    duration: "15 seconds",
    onTimeout: () => new FileWatcherReadyTimeoutError(),
  }),
);
```

4. **Lines 399-402**: BundleManager event listeners for replicant updates
```typescript
// Before (4 lines) - Non-Effect code, no cleanup
bundleManager.on("ready", updateBundlesReplicant);
bundleManager.on("bundleChanged", updateBundlesReplicant);
bundleManager.on("gitChanged", updateBundlesReplicant);
bundleManager.on("bundleRemoved", updateBundlesReplicant);

// After (12 lines) - Effect code with automatic cleanup and debouncing
const bundleManagerEvents = yield* Effect.all(
  [
    listenToEvent<void>(bundleManager, "ready"),
    listenToEvent<void>(bundleManager, "bundleChanged"),
    listenToEvent<void>(bundleManager, "gitChanged"),
    listenToEvent<void>(bundleManager, "bundleRemoved"),
  ],
  { concurrency: "unbounded" },
).pipe(
  Effect.andThen(Stream.mergeAll({ concurrency: "unbounded" })),
  Effect.andThen(Stream.debounce("100 millis")),
);
yield* Effect.forkScoped(
  Stream.runForEach(bundleManagerEvents, () =>
    Effect.sync(updateBundlesReplicant),
  ),
);
```

### Step 3: Add Unit Tests ✅

**Status**: ✅ Complete (created alongside Step 1)

**File**: `workspaces/nodecg/src/server/_effect/event-listener.test.ts`

**Test coverage**:
- `waitForEvent`:
  - Waits for single event and receives payload
  - Automatically cleans up listener after event fires
  - Verifies zero listener count after completion
- `listenToEvent`:
  - Streams multiple events continuously
  - Cleans up listener when stream scope closes
  - Verifies zero listener count after scope cleanup

**Test pattern**:
Uses `testEffect()` helper with scoped Effects and custom EventEmitter test fixture (`SimpleEventEmitter`) that emits incrementing numbers on interval.

### Step 4: Update Documentation

Add to `strategy.md` Phase 3 section:
- Mark as "In Progress" when starting implementation
- Reference log entry

Update CLAUDE.md if needed:
- Add EventEmitter utility patterns
- Document usage examples

## Problems & Solutions

### Problem 1: Lazy Stream Construction

**Issue**: Initially attempted using `Stream.asyncPush` which is lazy (pull-based). When used inside `Effect.forkScoped`, listeners weren't registered until stream was consumed, causing race conditions.

**Solution**: Changed `listenToEvent` to return `Effect<Stream<T>>` instead of bare `Stream<T>`. This makes listener setup eager (runs immediately when Effect is yielded) while keeping stream consumption lazy.

**Pattern**:
```typescript
// ❌ Wrong - lazy listener registration
export const listenToEvent = <T>(emitter, event) =>
  Stream.asyncPush<T>((emit) => { /* setup runs when consumed */ });

// ✅ Correct - eager listener registration
export const listenToEvent = <T>(emitter, event) =>
  Effect.gen(function* () {
    /* setup runs immediately when yielded */
    return Stream.fromQueue(queue);
  });
```

### Problem 2: Race Condition with Fork

**Issue**: Wrapping listener setup in `Effect.all` but keeping it inside `Effect.forkScoped` still caused race - fork returns immediately, setup runs in background.

**Solution**: Move `Effect.all` **outside** fork, run it in main fiber. Only fork the stream consumption:

```typescript
// ❌ Wrong - setup runs in background fiber
yield* Effect.forkScoped(
  Effect.all([...listenToEvent calls...]).pipe(...)
);

// ✅ Correct - setup runs in main fiber before continuing
const streams = yield* Effect.all([...listenToEvent calls...]);
yield* Effect.forkScoped(Stream.runForEach(...));
```

**Critical insight**: `Effect.all` runs in whichever fiber it's yielded in. When inside `Effect.forkScoped`, the entire `Effect.all` runs in the forked fiber, not the main fiber.

### Problem 3: Cleanup in Effect.async

**Initial attempt**: Tried adding manual cleanup inside `waitForEvent` handler before calling `resume()`. This was unnecessary because `eventEmitter.once()` automatically removes the listener after it fires.

**Solution**: Use `eventEmitter.once()` without manual cleanup - it handles listener removal automatically. The `Effect.async` cleanup function is only needed for interruption cases.

**Learning**: When using `once()`, the listener auto-removes on success, so no explicit cleanup needed in the success path.

## Files Modified

**New files** (Step 1 - ✅ Complete):
- `workspaces/nodecg/src/server/_effect/event-listener.ts` - Utilities implementation
- `workspaces/nodecg/src/server/_effect/event-listener.test.ts` - Unit tests

**To be modified** (Step 2 - Pending):
- `workspaces/nodecg/src/server/server/index.ts` - Refactor 4 event listener locations

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

## Next Steps

- [ ] Create `_effect/event-emitter.ts` with utilities
- [ ] Add comprehensive unit tests
- [ ] Refactor server/index.ts lines 114-124 (server error)
- [ ] Refactor server/index.ts lines 125-135 (server close)
- [ ] Refactor server/index.ts lines 268-286 (bundleManager ready)
- [ ] Refactor server/index.ts lines 399-402 (bundleManager events)
- [ ] Run all tests to verify no regressions
- [ ] Update documentation
- [ ] Mark as Completed

## Effect Patterns Established

### Pattern: Wait for Single Event

Wait for a one-time event with automatic cleanup using `waitForEvent`:

```typescript
// Wait for event (no data)
yield* waitForEvent(emitter, "ready")

// Wait for event with typed data
const error = yield* waitForEvent<Error>(server, "error")

// With timeout
yield* waitForEvent(emitter, "ready").pipe(
  Effect.timeoutFail({
    duration: "10 seconds",
    onTimeout: () => new TimeoutError()
  })
)

// Conditional check before waiting
yield* (condition
  ? Effect.void
  : waitForEvent(emitter, "event")
)

// Fork to background (non-blocking)
const fiber = yield* Effect.fork(
  waitForEvent(emitter, "close")
)
```

### Pattern: Continuous Event Stream

Convert single event to continuous stream using `listenToEvent`:

```typescript
// Listen to single event type continuously
const stream = yield* listenToEvent<BundleData>(emitter, "bundleChanged");
yield* Effect.forkScoped(
  Stream.runForEach(stream, (bundle) =>
    Effect.sync(() => console.log("Bundle:", bundle))
  )
);

// Process stream with transformations
const stream = yield* listenToEvent<number>(emitter, "value");
yield* Effect.forkScoped(
  stream.pipe(
    Stream.filter((n) => n > 0),
    Stream.map((n) => n * 2),
    Stream.runForEach((n) => Effect.log(`Doubled: ${n}`))
  )
);
```

### Pattern: Merge Multiple Event Streams

Merge multiple events with debouncing:

```typescript
// Listen to multiple event types with same handler
const bundleEvents = yield* Effect.all(
  [
    listenToEvent<void>(bundleManager, "ready"),
    listenToEvent<void>(bundleManager, "bundleChanged"),
    listenToEvent<void>(bundleManager, "gitChanged"),
    listenToEvent<void>(bundleManager, "bundleRemoved"),
  ],
  { concurrency: "unbounded" },
).pipe(
  Effect.andThen(Stream.mergeAll({ concurrency: "unbounded" })),
  Effect.andThen(Stream.debounce("100 millis")),
);

yield* Effect.forkScoped(
  Stream.runForEach(bundleEvents, () =>
    Effect.sync(updateBundlesReplicant)
  )
);
```

### Pattern: Forking Listener Setup

**Critical**: Run listener registration in main fiber before forking stream consumption:

```typescript
// ✅ Correct - setup runs before continuing
const streams = yield* Effect.all([
  listenToEvent<void>(emitter, "event1"),
  listenToEvent<void>(emitter, "event2"),
]);
const merged = Stream.mergeAll(streams, { concurrency: "unbounded" });
yield* Effect.forkScoped(Stream.runForEach(merged, handler));

// ❌ Wrong - race condition
yield* Effect.forkScoped(
  Effect.all([...listeners]).pipe(
    Effect.andThen(Stream.mergeAll(...)),
    Effect.andThen(Stream.runForEach(handler))
  )
);
```

**Why**: `Effect.forkScoped` returns immediately, running setup in background fiber. Listeners may not be registered when events fire.

## Lessons Learned

### Effect.async vs Stream.async

- **`Effect.async`**: Eager setup - runs immediately when Effect is yielded
- **`Stream.async`/`Stream.asyncPush`**: Lazy setup - only runs when stream is consumed (pull-based)
- For event listeners that must be registered immediately, wrap stream construction in `Effect.gen` to make setup eager

### Fiber Execution Model

`Effect.forkScoped` returns immediately and runs its Effect in a background fiber. This means:
- Code inside the fork runs asynchronously
- Code after `yield* Effect.forkScoped(...)` executes immediately, not after fork completes
- If listener registration is inside the fork, race conditions can occur

**Pattern**: Register listeners in main fiber, fork only the consumption.

### Queue-Based Event Streams

Pattern for bridging EventEmitter → Stream:
1. Create bounded queue (e.g., `Queue.bounded<T>(100)`)
2. Register EventEmitter listener that offers to queue (`Queue.unsafeOffer`)
3. Register finalizer to remove listener when scope closes (`Effect.addFinalizer`)
4. Return `Stream.fromQueue(queue)` for consumption

This pattern ensures:
- Backpressure handling (bounded queue)
- Automatic cleanup when scope closes
- Eager listener registration (setup runs immediately)

### Event Emission Discipline

When defining event types (e.g., in EventMap interfaces):
- Verify emission actually happens in relevant methods
- Event definitions without emissions are dead code
- Check both event registration AND emission paths
- Example: `bundleRemoved` event was defined but never emitted - found during refactoring

### eventEmitter.once() Auto-Cleanup

`eventEmitter.once()` automatically removes the listener after it fires. When using it with `Effect.async`:
- No need for manual cleanup in the success path
- Only need cleanup handler for interruption cases (return value from `Effect.async`)
- Simplifies implementation compared to manual listener management

### EventEmitterLike Interface

Using a generic interface instead of concrete `EventEmitter` type:
- Enables broader compatibility (works with any object implementing the interface)
- Allows testing with custom implementations (e.g., `SimpleEventEmitter`)
- Works with classes that extend EventEmitter (e.g., `BundleManager`)
- Type parameter `T extends any[]` enables type-safe event payloads
