# Effect-TS Migration Strategy for NodeCG

## Overview

NodeCG is migrating to Effect-TS using a top-down approach:

- Single `NodeRuntime.runMain` call at application startup (`workspaces/nodecg/src/server/bootstrap.ts`)
- Entire server runs as one Effect program
- Effect HTTP Router for core NodeCG routes (future)
- Express as catchall fallback for user-registered routes

## Migration Phases

### Phase 1: Bootstrap Migration ✅

**Complexity**: ⭐⭐⭐ Complex

Migrated `bootstrap.ts` to Effect with single `NodeRuntime.runMain` execution point.

**Key implementations**:

- `Effect.acquireRelease` for server lifecycle
- `Effect.raceFirst` for racing error handlers with indefinite operations
- Conditional OpenTelemetry loading via Config + dynamic imports
- Environment-based log level configuration

**Utilities created** (`_effect/`):

- `boundary.ts` - `UnknownError` tagged error for non-Effect code
- `log-level.ts` - `withLogLevelConfig` from `LOG_LEVEL` env var
- `span-logger.ts` - OpenTelemetry span logging with lazy runtime capture
- `test-effect.ts` - `testEffect()` helper for Vitest

**Key lessons**:

- `Effect.race` waits for first SUCCESS; use `Effect.raceFirst` for first completion
- `Effect.async` cleanup doesn't complete the fiber - must call `resume()` explicitly
- Never execute Effect at module top-level - use `Effect.fn` for lazy context capture

### Phase 2: Server Architecture ✅

**Complexity**: ⭐⭐ Moderate

Replaced `NodeCGServer` class with functional Effect-based architecture.

**Pattern**: Separate creation from execution

```typescript
const createServer = Effect.fn("createServer")(function* (isReady?) {
  // Setup resources with Effect.acquireRelease
  const io = yield* Effect.acquireRelease(createIo, closeIo);
  const replicator = yield* Effect.acquireRelease(
    createReplicator,
    saveReplicants,
  );

  return {
    bundleManager,
    run: Effect.async((resume) => {
      /* server runs until close/error */
    }),
  };
});
```

**Key lessons**:

- Put `Effect.scoped` in `main()`, not `createServer()` - scope must outlive resources
- Use `Deferred` parameter for ready signaling from native callbacks
- `Runtime.runSync(runtime, effect)` bridges native callbacks to Effect context
- `Effect.forkDaemon` for fibers that must survive parent completion

### Phase 3: Chokidar Wrapper ✅

**Complexity**: ⭐ Simple

Created Effect-friendly chokidar wrapper with automatic resource cleanup.

**API** (`_effect/chokidar.ts`):

```typescript
getWatcher(paths, options): Effect<FSWatcher, never, Scope>
waitForReady(watcher): Effect<FileEvent.ready>
listenToAdd/Change/Unlink/...(watcher): Effect<Stream<FileEvent>>
```

**Built on** (`_effect/event-listener.ts`):

- `waitForEvent<T>(emitter, name)` - One-time event → Effect
- `listenToEvent<T>(emitter, name)` - Continuous events → Effect<Stream>

**Key lessons**:

- `Stream.async` is lazy - wrap in `Effect.gen` for eager listener registration
- Keep listener setup in main fiber before forking stream consumption
- Use `Effect.acquireRelease` with `Effect.promise(() => watcher.close())` for async cleanup

### Phase 4: Bundle Manager Consumer ✅

**Complexity**: ⭐⭐ Moderate

Converted bundle consumers to `Effect.fn` wrappers while keeping legacy `BundleManager` class.

| File                                          | Event Handling                                          |
| --------------------------------------------- | ------------------------------------------------------- |
| `dashboard/index.ts`                          | `listenToEvent("bundleChanged")`                        |
| `graphics/index.ts`                           | None - stateless                                        |
| `sentry-config.ts`                            | `waitForEvent("ready")` + `listenToEvent("gitChanged")` |
| `assets.ts`                                   | Phase 3 chokidar wrapper                                |
| `sounds.ts`, `mounts.ts`, `shared-sources.ts` | None - setup only                                       |

### Phase 5: BundleManager Service ✅

**Complexity**: ⭐⭐⭐ Complex

Replaced legacy class-based `BundleManager` with `Effect.Service`.

**Service interface**:

```typescript
{
  find: (name: string) => NodeCG.Bundle | undefined;
  all: () => NodeCG.Bundle[];
  subscribe: () => Effect<Stream<BundleEvent>>;
  waitForReady: () => Effect<void>;
}
```

**Timer migration**:
| Timer | Duration | Effect Pattern |
|-------|----------|----------------|
| `readyTimeout` | 1000ms | `Stream.prepend` + `Stream.debounce` + `Stream.take(1)` |
| `handleChange` delay | 100ms | `awaitWriteFinish: true` (chokidar) |
| `backoffTimer` | 500ms | `Stream.groupByKey` + `Stream.debounce` per bundle |
| `gitChangeHandler` | 250ms | Nested `Stream.groupByKey` + `Stream.debounce` |

**Critical pattern - layer provision**:

```typescript
// bootstrap.ts - layer at outermost scope
const main = Effect.fn("main")(
  function* () {
    const server = yield* createServer();
    yield* server.run();
  },
  Effect.scoped,
  Effect.provide(
    Layer.provideMerge(
      BundleManager.Default,
      Layer.merge(NodecgConfig.Default, NodecgPackageJson.Default),
    ),
  ),
);
```

**Key lessons**:

- Layer scope closes when Effect.fn returns handle - move scoped layers to outermost scope
- For daemon fibers, provide layer INSIDE the fork: `Effect.forkDaemon(effect.pipe(Effect.provide(layer)))`
- Dynamic imports required for modules reading config at load time (after `NODECG_ROOT` set)
- `Deferred` simpler than streams for one-time ready signals

**Deferred**: Wire `GitService` to replace `git-rev-sync` (implemented but not connected)

### Phase 6: Route Libraries Migration

Migrate route handler classes to Effect-based services.

**Candidates**: GraphicsLib, DashboardLib, MountsLib, SoundsLib, AssetsMiddleware, SharedSourcesLib

### Phase 7: Login & Authentication

Migrate login middleware, session management, Socket.IO auth.

### Phase 8: Replicator & State Management

**Complexity**: ⭐⭐⭐⭐ Very Complex

Migrate Replicator, ReplicantAPI, database integration.

### Phase 9: ExtensionManager

Migrate extension loading, lifecycle, API provision, event broadcasting.

### Phase 10: Supporting Services

Config loading, Logger consolidation, utility functions.

### Phase 11: HTTP Server Integration (Future)

Evaluate replacing Express with Effect Platform HTTP Server.

## Architecture Principles

### Single Execution Point

- One `NodeRuntime.runMain` at startup
- All application logic composes as Effects
- No `Effect.runPromise` in application code

### Service-Based Design

- `Effect.Service` for core subsystems
- Layer pattern for composition
- Dependencies via Effect context

### Gradual Migration

- Each phase keeps application functional
- Tests run after each step
- Can pause at any phase boundary

## Effect-TS Coding Guidelines

### Services & Functions

- Always use `Effect.Service`, never Context API directly
- Use `Effect.fn("name")(function* (arg) { ... })` for effect-returning functions
- `Effect.gen` only for immediate instantiation, not function definitions

### Error Handling

- Explicit, descriptive error types
- Wrap external packages with typed Effect errors

### Type Safety

- Infer return types (no annotations unless circular)
- No `any`, no type assertions (`as`)

### Testing

- Use `testEffect()` helper from `_effect/test-effect.ts`
- Pattern: `testEffect(Effect.gen(...).pipe(Effect.provide(layer)))`

## Implementation Patterns

### Long-Running Servers

```typescript
// Use Effect.raceFirst for error handlers with indefinite operations
yield *
  Effect.raceFirst(
    Fiber.join(waitForServerStopFiber),
    Fiber.join(handleFloatingErrorsFiber),
  );
```

### Native Callback to Effect

```typescript
const runtime = yield * Effect.runtime();
server.listen({ host, port }, () =>
  Runtime.runSync(
    runtime,
    Effect.gen(function* () {
      if (isReady) yield* Deferred.succeed(isReady, undefined);
    }),
  ),
);
```

### Scoped Resources

```typescript
const makeResource = (deps) =>
  Effect.acquireRelease(
    Effect.sync(() => new Resource(deps)),
    (resource) => Effect.sync(() => resource.cleanup()),
  );
```

### Stream-Based Event Handling

```typescript
// Debounced ready signal
yield *
  addStream.pipe(
    Stream.debounce(Duration.seconds(1)),
    Stream.take(1),
    Stream.runDrain,
    Effect.andThen(() => Deferred.succeed(ready, undefined)),
    Effect.forkScoped,
  );
```

## Resources

- [Effect Documentation](https://effect.website/docs/getting-started/introduction/)
- [Effect API Reference](https://effect-ts.github.io/effect/)
