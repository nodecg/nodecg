# Effect-TS Migration Strategy for NodeCG

## Overview

NodeCG is migrating to Effect-TS using a top-down approach:

- Single `NodeRuntime.runMain` call at application startup (`workspaces/nodecg/src/server/bootstrap.ts`)
- Entire server runs as one Effect program
- Effect HTTP Router for core NodeCG routes
- Express as catchall fallback for user-registered routes
- HTTP layer entirely within Effect runtime

This ensures full Effect benefits (context propagation, error handling, interruption) throughout the HTTP layer while maintaining backward compatibility for user routes via `nodecg.mount()`.

## Migration Phases

### Phase 1: Server Entry Point ✅ COMPLETE

**Status**: ✅ Completed (2025-11-15)

Transform `workspaces/nodecg/src/server/bootstrap.ts` into an Effect program with single execution point.

**Implementation**:

- Single `NodeRuntime.runMain` execution point in `bootstrap.ts`
- Server lifecycle wrapped in `Effect.acquireRelease` for guaranteed cleanup
- Floating errors handled via `Effect.async` with proper fiber suspension/resume
- Uses `Effect.raceFirst` to wait for either server stop or error
- OpenTelemetry integration with custom span processor for trace logging
- Conditional OpenTelemetry loading using Config + dynamic imports (zero overhead when disabled)
- Log level configuration from `LOG_LEVEL` environment variable
- Removed custom exit hooks - Effect's interruption handles SIGTERM/SIGINT

**Utilities Created** (`workspaces/nodecg/src/server/_effect/`):

- `boundary.ts` - `UnknownError` for wrapping non-Effect exceptions
- `expect-error.ts` - Type utility for documenting expected errors
- `log-level.ts` - Environment-based log level configuration
- `span-logger.ts` - OpenTelemetry span processor with Effect logging (with unit tests)
- `test-effect.ts` - Vitest helper for running Effect tests (accepts `Effect<A, E, Scope.Scope>`)

**Dependencies Added**:

- Effect: `effect`, `@effect/platform`, `@effect/platform-node`, `@effect/opentelemetry`
- OpenTelemetry: `@opentelemetry/{api,core,resources,sdk-trace-base,sdk-trace-node,semantic-conventions}`
- Dev: `@effect/language-service` (TypeScript plugin)

See [migration log entry](./log/01-phase-1-bootstrap.md) for detailed implementation notes.

### Phase 2: Server Architecture Refactoring

**Status**: ✅ Complete

Replace `NodeCGServer` class with functional Effect-based architecture.

**Approach**:

- Remove class-based design, use plain Effect functions
- `createServer()` function sets up resources and returns handle with `run` Effect
- Resources use `Effect.acquireRelease` for guaranteed cleanup
- Cleanup logic from `stop()` method distributed into release functions
- Tests use Promise wrapper that manages Effect fibers internally

**Implementation**:

- `createServer(isReady?: Deferred<void>)` - Sets up all resources, returns `{ run, getExtensions, saveAllReplicantsNow }`
- Resources managed inline with `Effect.acquireRelease`:
  - Socket.IO: acquire (create server), release (disconnect + close)
  - Replicator: acquire (instantiate), release (saveAllReplicants)
  - ExtensionManager: acquire (instantiate + emit extensionsLoaded), release (emit serverStopping)
- Event listeners forked with `Effect.forkScoped` for automatic cleanup
- `run` Effect - Waits for server close or error using `Effect.raceFirst`
- Ready signaling via optional Deferred parameter (for test synchronization)
- Bootstrap: `const server = yield* createServer()` then `yield* server.run()` (all within `Effect.scoped`)
- Tests: Create Deferred, fork scoped Effect containing `createServer` + `run`, await ready

**Key Patterns Established**:

- **Separate create from run** - Resources created and returned in handle, run separately for long-lived servers
- **Scope at call site** - `Effect.scoped` applied in caller (bootstrap, tests), not in `createServer`
- **Bridging native callbacks** - Capture runtime with `yield* Effect.runtime()`, use `Runtime.runSync` in callbacks
- **Test wrapper pattern** - Promise-based API wrapping Effect fibers for backward compatibility
- **No classes in Effect** - Pure functional code, no class-based architecture

**Benefits**:

- No classes - pure functional Effect code
- Automatic cleanup via `acquireRelease`
- Clean test access via wrapper's `handle` property
- Maintains all public APIs (ExtensionManager broadcasts)
- Proper ready signaling for tests without race conditions

See [migration log entry](./log/02-phase-2-server-refactor.md) for detailed implementation notes and patterns learned.

### Phase 3: Chokidar → Effect Wrapper

**Status**: ✅ Complete

Create Effect-friendly wrapper for chokidar file watching API, built on reusable EventEmitter utilities.

**Current Problem**: Manual chokidar usage in bundle-manager and assets:

```typescript
// Module-level watcher, manual event handlers, manual cleanup
const watcher = chokidar.watch(paths, options);
watcher.on("add", handler);
watcher.on("change", handler);
// ... manual cleanup, deferred patterns, no type safety
```

**Solution**: Effect-friendly chokidar wrapper in `_effect/chokidar.ts`:

- `getWatcher(paths, options)` - Scoped watcher with automatic cleanup
- `waitForReady(watcher)` - Wait for initial scan, returns tagged `FileEvent.ready`
- `listenToAdd/Change/AddDir/Unlink/UnlinkDir/Error(watcher)` - Type-safe event streams
- `FileEvent` tagged enum for consistent event types
- Built on `waitForEvent`/`listenToEvent` utilities

**Implementation**:

- ✅ EventEmitter utilities (`_effect/event-listener.ts` + tests)
- ✅ Chokidar wrapper (`_effect/chokidar.ts` + tests)
- ✅ Tests using `@effect/platform` FileSystem
- ✅ All tests passing, no type errors

**Design Decisions**:

- Skipped `listenToAll()` - Too complex for type-safe narrowing
- Skipped `addPaths/unwatchPaths()` - Users call watcher methods directly
- Multi-arg event handling via tuple destructuring + Stream.map

**Benefits**:

- Type-safe file watching with automatic cleanup
- Stream-based event processing with tagged events
- Testable (scoped resources, no module-level state)
- Ready for use in BundleManager/Assets migrations

**Complexity**: ⭐ Simple

See [migration log entry](./log/03-chokidar-wrapper.md) for detailed implementation notes and patterns.

### Phase 4: Bundle Consumer Migration

**Status**: ✅ Complete

**Complexity**: ⭐⭐ Moderate

Converted bundle-consuming libraries to `Effect.fn` wrappers while keeping the legacy BundleManager class and events unchanged. Consumers now use `listenToEvent` streams inside Effect scopes, preparing for a service swap without breaking hot-reload behavior. Current state: `bundle-manager.ts` remains the active implementation with git-rev-sync + `process.chdir()` and global debounce state. See [migration log entry](./log/04-bundle-manager.md).

### Phase 5: BundleService Migration

**Status**: Planned

**Complexity**: ⭐⭐⭐ Complex

Replace the legacy BundleManager with an Effect-based BundleService (Ref state + PubSub + chokidar streams) and an Effect-wrapped git parser (`isomorphic-git`). Preserve ready/debounce timing, remove global state, and update consumers/bootstrap/tests. See [migration log entry](./log/05-bundle-service.md).

### Phase 6: Route Libraries Migration

Migrate route handler classes to Effect-based route services.

**Candidates** (following execution order in createServer):

1. **GraphicsLib** - Bundle graphics routes (already partially migrated in Phase 4 via Effect.fn consumer wrappers)
2. **DashboardLib** - Bundle dashboard routes
3. **MountsLib** - Static asset mounts
4. **SoundsLib** - Sound file serving
5. **AssetsMiddleware** - Asset serving middleware
6. **SharedSourcesLib** - Shared source serving

Each becomes a function returning Effect that sets up routes, replacing class-based design.

### Phase 7: Login & Authentication

Migrate login system to Effect.

**Components**:

- Login middleware (`workspaces/nodecg/src/server/login/`)
- Session management (Passport integration)
- Socket.IO authentication middleware

### Phase 8: Replicator & State Management

Migrate Replicator to Effect-based state management.

**Components**:

- Replicator class (`workspaces/nodecg/src/server/replicant/replicator.ts`)
- ReplicantAPI
- Database integration for persistence

**Complexity**: ⭐⭐⭐⭐ Very Complex (real-time state sync, Socket.IO integration)

### Phase 9: ExtensionManager

Migrate ExtensionManager to Effect.

**Components**:

- Extension loading and lifecycle
- Extension API provision
- Event broadcasting to extensions

### Phase 10: Supporting Services

Migrate remaining subsystems as needed:

1. **Config loading** - If needed, convert to ConfigService
2. **Logger** - Consolidate with Effect logging
3. **Utility functions** - Migrate as dependencies arise

### Phase 11: HTTP Server Integration (Future)

Evaluate whether to replace Express with Effect Platform HTTP Server.

**Considerations**:

- Effect HTTP Router for core routes
- Express as fallback for user-registered routes via `nodecg.mount()`
- Migration complexity vs benefits
- Backward compatibility requirements

**Decision**: Defer until other phases complete and benefits/tradeoffs are clearer.

## Architecture Principles

### Single Execution Point

- One `NodeRuntime.runMain` call at application startup
- All application logic composes as Effects
- Entire HTTP layer (Effect HTTP Router + Express fallback) runs within Effect runtime
- No `Effect.runPromise` calls in application code

### Service-Based Design

- Core subsystems exposed as Effect services using `Effect.Service`
- Services composed using Layer pattern
- Dependencies injected through Effect's context system

### Gradual Migration

- Each phase keeps the application functional
- Tests run after each migration step
- Can pause at any phase boundary

## Effect-TS Coding Guidelines

These guidelines ensure consistency and best practices across all migrated code.

### Services & Architecture

- **Always use `Effect.Service`** - Never use Context API directly for service creation
- **Don't wrap Effect services** - Do not create a service that only wraps another Effect-based service
- **Separate domain from infrastructure** - Domain logic should be pure if possible; I/O and infrastructure operations should be defined as services
- **Wrap external packages carefully** - When using non-Effect external packages, create a service that handles errors gracefully

### Function Definition

- **Use `Effect.fn` for effect-returning functions**:

  ```typescript
  // ✅ Correct
  const myFunction = Effect.fn("myFunction")(function* (arg: string) {
    // ...
  });

  // ❌ Wrong - don't use Effect.gen for function definitions
  const myFunction = (arg: string) =>
    Effect.gen(function* () {
      // ...
    });
  ```

- **`Effect.gen` only for immediate instantiation** - Use it when you need to create and immediately execute an effect, not for defining reusable functions

### Dependencies & Packages

- **Check Effect-TS API first** - Before adding external dependencies or implementing functionality, check the [Effect-TS API documentation](https://effect-ts.github.io/effect/) for existing Effect-based solutions
- **Use npm install with @latest** - When installing Effect packages, use `npm i @effect/something@latest` in the relevant workspace directory. Never directly edit package.json

### Error Handling

- **Explicit error types** - Error types and their names must be explicit and clear, making it obvious what went wrong
- **Graceful wrapping** - Services wrapping external packages must handle all possible errors and convert them to typed Effect errors

### Testing

- **Test framework preference** - Try `@effect/vitest` first; if peer dependency conflicts with vitest v4, use `testEffect()` helper from `src/server/_effect/test-effect.ts`
- **@effect/vitest patterns** - When available: `layer(TestLayer)("suite", (it) => { it.effect("test", Effect.fn(function* () { ... })) })`; pass Effect directly to `it.effect()`, not wrapped in arrow function
- **testEffect() helper** - Accepts `Effect<A, E, Scope.Scope>` and automatically wraps with `Effect.scoped`; provide layers before passing: `testEffect(Effect.gen(...).pipe(Effect.provide(layer)))`
- **Effect.gen vs Effect.fn** - Use `Effect.gen` for immediate instantiation in tests; use `Effect.fn` only when defining reusable effect-returning functions
- **Test isolation** - Each test should have isolated state (e.g., separate logger instances, fresh arrays for capturing logs)
- **Comprehensive unit tests** - Write unit tests for each service and domain logic
- **E2E with DI** - E2E tests should utilize Effect-TS's dependency injection to properly test service interactions
- **Maintain coverage** - Aim to maintain or improve existing test coverage during migration

### Type Safety

- **Infer return types** - Do not annotate return types unless absolutely needed (e.g., recursive functions)
- **Never widen with return types** - Do not use return type annotations to widen or combine types; fix the implementation instead
- **No `any`** - Do not use `any` under any circumstances
- **No type assertions** - Do not use type assertions (e.g., `as Type`) under any circumstances

## Migration Log

All migration work must be documented in `docs/effect-migration/log/`. Each entry is a separate markdown file for better organization and LLM context management.

**What to log**:

- **Plans** - Detailed implementation plans before starting work
- **Decisions** - Key architectural decisions and rationale
- **Problems & Solutions** - Issues encountered and how they were solved
- **Patterns** - Effect patterns established or discovered
- **Lessons learned** - Gotchas and insights from implementation
- **Status** - Migration status (planned, in progress, completed, blocked)

**Why we log**:

- **Planning** - Document the plan before implementation for clarity and review
- **Historical context** - Understand why decisions were made months later
- **Pattern reference** - See how similar problems were solved before
- **Knowledge sharing** - Team members can learn from each other's experiences
- **Progress tracking** - Clear visibility into what's been migrated and what remains

**How to add entries**:

1. Create new file in `log/` directory: `##-brief-description.md` (sequential numbering)
2. Use template from [log/README.md](./log/README.md)
3. **Start with the plan** - Document the approach before implementation
4. **Update during work** - Add problems/solutions as they arise
5. **Complete on finish** - Mark as completed and add lessons learned

See the [migration log](./log/README.md) for all entries and the template.

## Implementation Patterns

### Creating Effect Services

Each subsystem becomes a service using `Effect.Service`:

```typescript
class ConfigService extends Effect.Service<ConfigService>()("ConfigService", {
  effect: Effect.gen(function* () {
    const rawConfig = yield* Effect.promise(() => fs.readFile("config.json"));
    const config = yield* Schema.decodeUnknown(ConfigSchema)(rawConfig);
    return config;
  }),
}) {}
```

Services are accessed in the main program via their tag:

```typescript
const config = yield * ConfigService;
```

### Wrapping Non-Effect Code

Wrap existing code during migration:

```typescript
// Sync functions
const result = yield * Effect.sync(() => someSyncFunction());

// Async functions
const result = yield * Effect.promise(() => someAsyncFunction());

// Callbacks
const result =
  yield *
  Effect.async<string>((resume) => {
    legacyCallback((err, data) => {
      if (err) resume(Effect.fail(err));
      else resume(Effect.succeed(data));
    });
  });
```

### HTTP Server with Express Fallback

Effect HTTP Router handles core routes, Express handles user-registered routes:

```typescript
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "@effect/platform";
import { NodeHttpServer } from "@effect/platform-node";
import express from "express";

const expressApp = express();

// Users register custom routes via nodecg.mount()
// which internally does: expressApp.use(path, handler)

const router = HttpRouter.empty.pipe(
  // Core NodeCG routes use Effect
  HttpRouter.get("/api/bundles",
    Effect.gen(function* () {
      const bundles = yield* BundleService;
      return HttpServerResponse.json(bundles.all());
    })
  ),
  HttpRouter.post("/api/bundles/:bundle/reload",
    Effect.gen(function* () {
      const bundles = yield* BundleService;
      const params = yield* HttpRouter.params;
      yield* bundles.reload(params.bundle);
      return HttpServerResponse.json({ success: true });
    })
  ),
  // Fallback to Express for unmatched routes (bundle graphics, dashboards, user routes)
  HttpRouter.catchAll(() =>
    Effect.gen(function* () {
      const req = yield* HttpServerRequest.HttpServerRequest;
      const nodeReq = req.source; // Native Node.js IncomingMessage
      const nodeRes = yield* /* get native ServerResponse */;

      return yield* Effect.async<HttpServerResponse.HttpServerResponse>((resume) => {
        expressApp(nodeReq, nodeRes, (err) => {
          if (err) resume(Effect.fail(err));
          else resume(Effect.succeed(HttpServerResponse.empty()));
        });
      });
    })
  )
);

// HTTP server runs entirely within Effect
const app = router.pipe(HttpRouter.toHttpApp);
yield* NodeHttpServer.serve(app);
```

This keeps the entire HTTP layer in Effect while maintaining backward compatibility with Express-based user routes.

### Long-Running Servers with Effect

When integrating long-running servers (HTTP, WebSocket, etc.) with Effect, follow these patterns:

#### Use Effect.never for Indefinite Operations

Long-running servers should use `Effect.never` to represent operations that run until interrupted:

```typescript
const program = Effect.acquireRelease(
  Effect.gen(function* () {
    const server = new NodeCGServer();
    yield* Effect.promise(() => server.start());

    // Server runs indefinitely - only completes when interrupted
    yield* Effect.never;

    return server;
  }),
  (server) => Effect.promise(() => server.stop()),
);

NodeRuntime.runMain(Effect.scoped(program));
```

**Why**: Servers are meant to run forever, not complete after a timeout. `Effect.never` correctly models this behavior, and Effect's runtime will interrupt it on SIGTERM/SIGINT.

#### Listen to Native Events, Not Manual Events

Use native system events (e.g., HTTP server's 'close') instead of manually-emitted events:

```typescript
const program = Effect.acquireRelease(
  Effect.gen(function* () {
    const server = new NodeCGServer();

    // Create error promise from native event
    const errorPromise = new Promise<never>((_, reject) => {
      server.once("error", reject);
    });

    yield* Effect.promise(() => server.start());

    // Race indefinite operation against error condition
    yield* Effect.race(
      Effect.never,
      Effect.promise(() => errorPromise),
    );

    return server;
  }),
  (server) => Effect.promise(() => server.stop()),
);
```

**Why**: Native events represent actual system state (e.g., "the HTTP server has closed"), while manually-emitted events are just notifications that depend on code execution and might not fire in error conditions.

#### Avoid Arbitrary Timeouts

Don't use timeouts for long-running servers:

```typescript
// ❌ Wrong - server should run forever
yield * Effect.timeout("5 minutes")(serverOperation);

// ✅ Correct - server runs until interrupted
yield * Effect.never;
```

**Why**: Timeouts are for operations with expected completion times. Servers run indefinitely and should only stop when explicitly interrupted (SIGTERM/SIGINT) or when an error occurs.

#### Handle Recoverable vs. Fatal Errors

Not all errors should terminate the server. Distinguish between recoverable and fatal errors:

```typescript
// Recoverable error - log and continue
io.on("error", (err) => {
  log.error(err);
  // Socket.IO continues running
});

// Fatal error - propagate to Effect
server.on("error", (err) => {
  // HTTP server errors are fatal
  resume(Effect.fail(err));
});
```

**Why**: Some components (like Socket.IO) can recover from errors and continue running. Only propagate truly fatal errors that should terminate the server.

#### Use Effect.raceFirst for Competing Completions

When racing error handlers against indefinite operations, use `Effect.raceFirst` instead of `Effect.race`:

```typescript
// ❌ Wrong - hangs if one fails and one never completes
yield *
  Effect.race(
    Effect.never, // Never completes
    handleErrorsEffect, // Might fail
  );

// ✅ Correct - completes when first effect finishes (success or failure)
yield *
  Effect.raceFirst(
    serverStoppedEffect, // Succeeds when server stops
    handleErrorsEffect, // Fails when error occurs
  );
```

**Key differences**:

- `Effect.race`: Waits for first SUCCESS; if all fail, returns combined errors
- `Effect.raceFirst`: Completes on first completion (success OR failure)

**When to use `raceFirst`**:

- Racing error handlers with indefinite operations
- When you care about whichever completes first, regardless of success/failure
- Error handling scenarios where one effect failing should end the race

#### Effect.async Requires Explicit Resume

Fibers suspended in `Effect.async` must call `resume()` to complete, even after cleanup:

```typescript
const handleErrors = Effect.async<void, Error>((resume) => {
  const handler = (err: Error) => {
    cleanup(); // Remove listeners
    resume(Effect.fail(err)); // MUST call resume to complete fiber
  };

  const cleanup = () => {
    process.removeListener("uncaughtException", handler);
  };

  process.on("uncaughtException", handler);

  return Effect.sync(cleanup); // Cleanup for interruption
});
```

**Why**:

- The cleanup Effect (returned from `Effect.async`) only removes resources
- It does NOT complete the suspended fiber
- The fiber remains suspended until `resume()` is explicitly called
- Without `resume()`, the fiber hangs forever even if cleanup ran

**Pattern**:

1. Call cleanup to remove listeners/resources
2. Call `resume(Effect.succeed(value))` or `resume(Effect.fail(err))` to complete the fiber
3. Return cleanup Effect for interruption cases (SIGINT/SIGTERM)

## Database Adapter Note

The current SQLite database adapter is marked as "legacy" and uses deprecated TypeORM. However, we're **not prioritizing its migration at this stage**. It will be rewritten with Effect later when the time is right, showcasing:

- Effect.Schema for models
- Layer pattern for connection management
- Effect for async operations with proper error handling
- Resource safety for database connections

## Success Criteria

- Maintain NodeCG's functionality throughout the migration
- Single execution point at application startup using `NodeRuntime.runMain`
- Improved error handling and type safety across the entire stack
- Full Effect benefits (interruption, resource management, context propagation)
- Clear patterns for Effect-based Express integration

## Resources

- [Effect Documentation](https://effect.website/docs/getting-started/introduction/)
- [Running Effects](https://effect.website/docs/getting-started/running-effects/)
- [Effect vs Promise](https://effect.website/docs/additional-resources/effect-vs-promise/)
- [Effect GitHub](https://github.com/Effect-TS/effect)
