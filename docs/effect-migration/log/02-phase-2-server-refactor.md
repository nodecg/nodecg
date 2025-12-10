# Phase 2: Server Architecture Refactoring

**Status**: In Progress
**Complexity**: ⭐⭐ Moderate

## Overview

Replace `NodeCGServer` class with functional Effect-based architecture. The current class-based design with EventEmitter is replaced with plain Effect functions using `Effect.acquireRelease` for resource management.

## Goals

- Remove class-based architecture (no classes in Effect)
- Use plain Effect functions for server lifecycle
- Distribute cleanup logic from `stop()` method into `acquireRelease` release functions
- Maintain test access to internal instances without type casting
- Preserve all public APIs (ExtensionManager broadcasts to bundle extensions)

## Key Decisions

### 1. Separate Creation from Execution

**Decision**: Use `createServer()` that returns a handle with resources and a `run` Effect, instead of a class with `start()` method

**Rationale**:

- Tests need access to instances (bundleManager, extensionManager, replicator)
- Server needs to run until it stops/errors (blocking operation)
- Separation allows tests to fork `run` and access handle simultaneously
- Matches existing pattern: instantiate → start

**Pattern**:

```typescript
export const createServer = Effect.fn("createServer")(function* () {
  // Setup all resources
  const bundleManager = new BundleManager(...)
  const io = yield* makeIo(server)
  const replicator = yield* makeReplicator(io, adapter, persisted)
  const extensionManager = yield* makeExtensionManager(io, bundleManager, replicator, mount)

  return {
    bundleManager,
    extensionManager,
    replicator,
    run: Effect.async<void, UnknownError>((resume) => {
      // Server runs until close or error
    })
  }
})
```

### 2. Use Effect.acquireRelease for Resource Cleanup

**Decision**: Create separate `make*` functions for each resource that needs cleanup, using `Effect.acquireRelease`

**Rationale**:

- Guarantees cleanup runs even on interruption
- Distributes cleanup logic close to resource creation
- Each resource manages its own lifecycle
- Cleanup from `stop()` method naturally maps to release functions

**Resources with cleanup**:

- Socket.IO: disconnect + close
- Replicator: save all replicants
- ExtensionManager: emit serverStopping event

### 3. Remove EventEmitter, Keep Public API

**Decision**: Remove NodeCGServer's internal EventEmitter, but keep ExtensionManager's `emitToAllInstances` calls

**Rationale**:

- NodeCGServer's events (`error`, `started`, `stopped`, `extensionsLoaded`) are not used by any internal code
- ExtensionManager's broadcasts (`extensionsLoaded`, `serverStarted`, `serverStopping`, `login`, `logout`) are documented public API for bundle extensions
- Removing unused internal events simplifies code
- Maintaining public API ensures backward compatibility

**Events removed** (unused):

- Line 337: `this.emit("error", err)` - no listeners
- Line 423: `this.emit("extensionsLoaded")` - no listeners
- Line 452: `this.emit("started")` - no listeners
- Line 481: `this.emit("stopped")` - no listeners

**Events kept** (public API):

- `extensionManager.emitToAllInstances("extensionsLoaded")` - documented in /nodecg/docs
- `extensionManager.emitToAllInstances("serverStarted")` - documented in /nodecg/docs
- `extensionManager.emitToAllInstances("serverStopping")` - documented in /nodecg/docs
- `extensionManager.emitToAllInstances("login/logout")` - documented in /nodecg/docs

### 4. Test Access via Handle, Not Type Casting

**Decision**: Tests access instances via the returned handle object, not `(server as any)._bundleManager`

**Rationale**:

- Cleaner, type-safe access
- No need for private fields or type assertions
- Explicit public API for what tests can access
- Matches the pattern of returning a handle object

**Before**:

```typescript
const server = yield * instantiateServer();
const allBundles = (server as any)._bundleManager.all();
```

**After**:

```typescript
const server = yield * createServer();
const allBundles = server.bundleManager.all();
```

## Implementation

### Resource Setup Functions

Each resource that needs cleanup gets its own `acquireRelease` wrapper:

**1. `makeIo(server: Server)`**

- Creates Socket.IO server instance
- Sets max listeners, attaches error handler
- **Release**: Disconnect all sockets, close server (from stop() lines 462-468)

**2. `makeReplicator(io, adapter, persisted)`**

- Creates Replicator instance
- **Release**: Call `saveAllReplicants()` (from stop() lines 471-473)

**3. `makeExtensionManager(io, bundleManager, replicator, mount)`**

- Creates ExtensionManager instance
- Loads all extensions in dependency order
- **Release**: Emit `serverStopping` event to extensions (from stop() line 461)

### Main Server Creation Function

**`createServer()`**:

1. Set up Express app and HTTP/HTTPS server (from constructor lines 110-154)
2. Configure middleware, authentication, routes (from start() lines 168-370)
3. Create BundleManager (no cleanup needed)
4. Yield from `makeIo`, `makeReplicator`, `makeExtensionManager` to get resources
5. Wait for bundle manager to become ready
6. Create extension manager and emit `extensionsLoaded` to extensions
7. Return handle with `{ bundleManager, extensionManager, replicator, run }`

**`run` Effect**:

- Starts HTTP server listening
- Emits `serverStarted` to extensions
- Uses `Effect.async` to wait for server `close` or `error` events
- Completes with success on close, fails on error

### Bootstrap Changes

**Before**:

```typescript
const server = yield * instantiateServer();
yield * Effect.promise(() => server.start());
// Wait for stop...
```

**After**:

```typescript
const server = yield * createServer();
yield * server.run; // Runs until stop/error
// Cleanup happens automatically via acquireRelease
```

**Important**: Keep `Effect.scoped` in `main()`, NOT in `createServer()`. The scoped wrapper ensures all `acquireRelease` cleanup runs when main completes.

### Test Changes

**Pattern**:

```typescript
test("test bundles", async () => {
  await Effect.gen(function* () {
    const server = yield* createServer();

    // Fork server to run in background
    const serverFiber = yield* Effect.fork(server.run);

    // Access instances directly from handle
    const allBundles = server.bundleManager.all();
    expect(allBundles.length).toBeGreaterThan(0);

    // Cleanup via interrupt (triggers all release functions)
    yield* Fiber.interrupt(serverFiber);
  }).pipe(Effect.scoped, Effect.runPromise);
});
```

## Effect Patterns Established

### Separate Create from Run for Long-Running Servers

When resources need to be accessed externally (tests, other code), separate creation from execution:

```typescript
const createResource = Effect.fn("createResource")(function* () {
  const instance = yield* makeInstance();

  return {
    instance, // Exposed for external access
    run: Effect.async(() => {
      // Long-running operation
    }),
  };
});

// Usage
const resource = yield * createResource();
yield * Effect.fork(resource.run); // Run in background
resource.instance; // Access externally
```

### Distribute Cleanup with acquireRelease

Instead of one large cleanup function, create focused `acquireRelease` wrappers for each resource:

```typescript
const makeResource = (deps) =>
  Effect.acquireRelease(
    Effect.sync(() => new Resource(deps)),
    (resource) =>
      Effect.sync(() => {
        resource.cleanup();
      }),
  );
```

**Benefits**:

- Cleanup logic lives next to creation logic
- Guaranteed cleanup even on interruption
- Composable - resources can depend on other resources
- Clear ownership of cleanup responsibility

### Public API Event Preservation

When removing internal event systems, distinguish between:

- **Internal events**: Used only within the application (safe to remove)
- **Public API events**: Documented for external consumers (must preserve)

Check documentation and external usage before removing events.

## Challenges

### 1. Stop() Logic Distribution

**Challenge**: Current `stop()` method has cleanup in one place. Need to distribute to multiple `acquireRelease` release functions.

**Solution**: Map each cleanup operation to its corresponding resource:

- `io.disconnectSockets()` + `io.close()` → `makeIo` release
- `replicator.saveAllReplicants()` → `makeReplicator` release
- `extensionManager.emitToAllInstances("serverStopping")` → `makeExtensionManager` release

### 2. Scope Management

**Challenge**: If `Effect.scoped` is on `createServer`, cleanup runs immediately after creation (before `run` executes).

**Solution**: Put `Effect.scoped` in `main()`, not `createServer()`. This way:

1. `createServer()` creates resources with `acquireRelease`
2. Returns handle with `run` Effect
3. `main()` runs `server.run` within scoped context
4. When `main()` scope closes, all cleanup runs

### 3. Test Access to Instances

**Challenge**: Tests need access to bundleManager and other instances for assertions.

**Solution**: Return handle object with instances. Tests call `createServer()`, fork `run` in background, access instances from handle.

## Files Modified

- `workspaces/nodecg/src/server/server/index.ts` - Complete rewrite as Effect functions
- `workspaces/nodecg/src/server/bootstrap.ts` - Simplified to call createServer() and run
- `workspaces/nodecg/test/legacy-mode/core.test.ts` - Update to use handle pattern
- `docs/effect-migration/strategy.md` - Added Phase 2 section
- `docs/effect-migration/log/02-phase-2-server-refactor.md` - This file

## Implementation Issues & Solutions

### Issue 1: Scope Cleanup Timing

**Problem**: Initial implementation used `Effect.scoped` directly in test `start()`:

```typescript
await Effect.runPromise(createServer().pipe(Effect.scoped));
```

This caused cleanup to run immediately after `createServer()` completed, before `run` executed, destroying all resources.

**Solution**: Run the scoped Effect in a fiber to keep scope alive:

```typescript
mainFiber =
  yield *
  Effect.fork(
    Effect.gen(function* () {
      const handle = yield* createServer();
      serverHandle = handle;
      const serverFiber = yield* Effect.fork(handle.run);
      yield* Fiber.join(serverFiber); // Keep scope alive
    }).pipe(Effect.scoped),
  );
```

The scope stays open because the fiber waits on `Fiber.join(serverFiber)`. Interrupting `mainFiber` triggers cleanup.

**Pattern Learned**: When bridging Effect to Promise-land and needing long-lived scopes, fork the scoped Effect in a fiber and keep it alive.

### Issue 2: Ready Signaling Too Early

**Problem**: Tests need to know when the server is actually listening (to access `NODECG_TEST_PORT`), but initial implementation signaled ready immediately after forking `run`:

```typescript
const serverFiber = yield * Effect.fork(handle.run);
yield * Deferred.succeed(ready, undefined); // ❌ Too early!
```

The `run` Effect starts the server asynchronously in the listen callback, but we signal before that happens.

**Solution** (implemented): Accept `ready: Deferred<void>` as optional parameter to `createServer()`:

1. Caller creates `ready: Deferred<void>` before calling `createServer(ready)`
2. `createServer` accepts optional `isReady?: Deferred<void>` parameter
3. In the listen callback (called when server is listening), succeed the Deferred
4. Tests await the ready Deferred after forking

```typescript
// In createServer
server.listen({ host, port }, () => {
  Runtime.runSync(
    runtime,
    Effect.gen(function* () {
      // Set NODECG_TEST_PORT for tests
      if (isReady) {
        yield* Deferred.succeed(isReady, undefined);
      }
      extensionManager.emitToAllInstances("serverStarted");
    }),
  );
});
```

**Pattern Learned**: For async operations needing external synchronization, accept a Deferred as a parameter rather than returning one. The callback-based approach is simpler than listening to events when the callback itself indicates completion.

### Issue 3: Test Compatibility

**Problem**: Existing tests use Promise-based interface (`start()`, `stop()`) and access private fields (`_bundleManager`).

**Solution**: Create a compatibility wrapper that bridges Effect to Promises:

```typescript
interface TestServerWrapper {
  start: () => Promise<void>;
  stop: () => Promise<void>;
  getExtensions: ServerHandle["getExtensions"];
  saveAllReplicantsNow: ServerHandle["saveAllReplicantsNow"];
  handle: ServerHandle; // Direct access to server handle
}
```

Tests use the wrapper's Promise API, while internally it manages Effect fibers. The `handle` property exposes `bundleManager` for test assertions.

**Pattern Learned**: When migrating from Promise to Effect incrementally, create thin wrapper layers that maintain the old interface while using Effect internally.

### Issue 4: Effect.runFork vs yield\* Effect.fork

**Problem**: Used `Effect.runFork()` inside `Effect.gen`, which the linter flagged.

**Solution**: Use `yield* Effect.fork()` when inside an Effect context:

```typescript
// ❌ Wrong - Effect.runFork inside Effect
mainFiber = Effect.runFork(Effect.gen(...));

// ✅ Correct - yield* Effect.fork
mainFiber = yield* Effect.fork(Effect.gen(...));
```

**Pattern Learned**: `Effect.runFork()` is for running Effects outside Effect context. Inside `Effect.gen`, always `yield*` from Effects.

### Issue 5: Bridging Native Callbacks to Effect Context

**Problem**: The `server.listen()` callback is a native Node.js callback (not Effect context), but needs to run Effect code (succeed Deferred, log with Effect logger).

**Solution**: Capture the Effect runtime with `yield* Effect.runtime()` and use `Runtime.runSync(runtime, effect)` in the callback:

```typescript
const runtime = yield * Effect.runtime();

const run = Effect.fn(function* () {
  server.listen({ host, port }, () =>
    Runtime.runSync(
      runtime,
      Effect.gen(function* () {
        // Effect code here
        if (isReady) {
          yield* Deferred.succeed(isReady, undefined);
        }
        extensionManager.emitToAllInstances("serverStarted");
      }),
    ),
  );
  // ...
});
```

**Pattern Learned**: When native callbacks need to run Effect code, capture the runtime beforehand and use `Runtime.runSync/runPromise` to bridge the gap. The captured runtime includes all FiberRefs (log level, tracing config, etc.).

## Implementation Status

### Completed

- [x] Implement resource management with `Effect.acquireRelease` for io, replicator, extensionManager
- [x] Implement `createServer` function with all setup logic
- [x] Update bootstrap.ts to use new Effect-based pattern
- [x] Remove NodeCGServer class, EventMap interface, TypedEmitter import
- [x] Create test compatibility wrapper (Promise-based API wrapping Effect fibers)
- [x] Fix scope management (fiber-based scoping with `Effect.scoped`)
- [x] Use Deferred for ready synchronization instead of manual promises
- [x] Use `yield* Effect.fork()` instead of `Effect.runFork()`
- [x] Implement ready signaling via optional Deferred parameter to `createServer()`
- [x] Update both test helpers (`helpers/setup.ts` and `installed-mode/setup.ts`) to use ready Deferred
- [x] Use `Effect.forkScoped` to fork error/close listeners so they're cleaned up with server
- [x] Use `Runtime.runSync` with captured runtime for listen callback (bridges native callback to Effect)

### Remaining

- [ ] Expose `bundleManager` in createServer return value (if tests need direct access)
- [ ] Run full test suite to verify all functionality works
- [ ] Verify ExtensionManager broadcasts still work for bundle extensions
- [ ] Document pattern: capturing runtime with `yield* Effect.runtime()` for use in native callbacks

## Key Implementation Details

### Resource Management Pattern

Instead of separate `make*` functions as originally planned, resources are managed directly in `createServer` using `Effect.acquireRelease`:

1. **Socket.IO** (lines 137-151):

   - Acquire: Create Socket.IO server, set max listeners
   - Release: Disconnect all sockets, close server

2. **Replicator** (lines 334-339):

   - Acquire: Create Replicator with adapter and persisted entities
   - Release: Call `saveAllReplicants()`

3. **ExtensionManager** (lines 405-411):

   - Acquire: Create ExtensionManager, emit `extensionsLoaded`
   - Release: Emit `serverStopping` to all extensions

4. **Error/Close Event Listeners** (lines 114-135):
   - Uses `Effect.forkScoped` to fork listeners that auto-cleanup when scope closes
   - Listeners convert native events to Effect failures/successes

### createServer Signature

```typescript
export const createServer = Effect.fn("createServer")(function* (
  isReady?: Deferred.Deferred<void>,
): Effect.Effect<ServerHandle, UnknownError, Scope> { ... }
```

- Accepts optional `isReady` Deferred for tests to await listening
- Requires `Scope` (caller must use `Effect.scoped`)
- Returns handle with `{ run, getExtensions, saveAllReplicantsNow }`

### Test Wrapper Pattern

Tests use a Promise-based wrapper that internally manages Effect fibers:

```typescript
interface TestServerWrapper {
  start: () => Promise<void>; // Creates ready Deferred, forks scoped Effect
  stop: () => Promise<void>; // Interrupts fiber (triggers cleanup)
  getExtensions: ServerHandle["getExtensions"];
  saveAllReplicantsNow: ServerHandle["saveAllReplicantsNow"];
  handle: ServerHandle; // Direct access to server internals
}
```

The wrapper:

1. Creates a ready Deferred
2. Forks the scoped Effect containing `createServer` and `run`
3. Awaits the ready Deferred before returning from `start()`
4. Stores the fiber for later interruption via `stop()`

## Files Modified

- `workspaces/nodecg/src/server/server/index.ts` - Complete rewrite from class to Effect functions
- `workspaces/nodecg/src/server/bootstrap.ts` - Simplified to call createServer() and run
- `workspaces/nodecg/test/helpers/setup.ts` - Test compatibility wrapper for legacy mode
- `workspaces/nodecg/test/installed-mode/setup.ts` - Test compatibility wrapper for installed mode
- `docs/effect-migration/log/02-phase-2-server-refactor.md` - This file
