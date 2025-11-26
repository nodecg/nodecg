# Phase 1: Bootstrap Migration to Effect

**Status**: Completed
**Complexity**: ⭐⭐⭐ Complex

## Overview

Migrated NodeCG's server entry point (`bootstrap.ts`) to Effect-TS with single execution point using `NodeRuntime.runMain`. This establishes the foundation for the entire Effect migration by running the server within the Effect runtime with proper error handling, resource management, and graceful shutdown.

## Goals

- Single `NodeRuntime.runMain` execution point
- Replace custom exit hooks with Effect's interruption mechanism
- Proper lifecycle management with `Effect.acquireRelease`
- Handle floating errors (uncaughtException, unhandledRejection)
- Integrate OpenTelemetry for observability
- Environment-based log level configuration

## Key Decisions

### 1. Top-Down Migration Approach

**Decision**: Migrate from entry point downward rather than leaf functions upward

**Rationale**:

- Single execution point at application startup
- Full Effect benefits (context propagation, error handling, interruption) throughout
- No scattered `Effect.runPromise` calls in application code
- Aligns with Effect's "single execution point" philosophy

### 2. Use Effect.raceFirst for Competing Completions

**Decision**: Race server stop events against error handlers using `Effect.raceFirst`

**Rationale**:

- `Effect.race` waits for first SUCCESS, hangs if one fails and one never completes
- `Effect.raceFirst` completes on first completion (success OR failure)
- Appropriate when racing error handlers against indefinite operations

### 3. Listen to Native Events, Not Manual Events

**Decision**: Listen to HTTP server's native 'close' event instead of manually-emitted "stopped" event

**Rationale**:

- Native events represent actual system state (HTTP server closure)
- Manually-emitted events are notifications that might not fire in error conditions
- Prevents zombie processes if server crashes without emitting custom events

### 4. Lazy Runtime Capture for OpenTelemetry

**Decision**: Use `Effect.fn` wrappers to capture runtime when called, not at module load

**Rationale**:

- Span processors need Effect Runtime for Effect logging
- Capturing at module load executes Effect code at top-level (anti-pattern)
- Runtime snapshots include FiberRef values (log level, etc.)

## Problems & Solutions

### Problem 1: Effect.race Hangs on Error

**Problem**: After calling `resume(Effect.fail(err))` in uncaught exception handler, process hung indefinitely. Cleanup never ran.

**Root Cause**: `Effect.race` waits for first SUCCESS. If one effect fails and another never completes, race hangs forever.

**Investigation**:

- Added extensive logging throughout bootstrap.ts
- Observed "Fiber terminated with an unhandled error" log but no race completion
- Read Effect source code in `node_modules/effect/src/internal/fiberRuntime.ts`:
  - Lines 3632-3661: `Effect.race` implementation with observer pattern
  - Lines 3652-3661: `completeRace()` only resumes parent if winner succeeds

**Solution**: Use `Effect.raceFirst` instead of `Effect.race`

```typescript
yield *
  Effect.raceFirst(
    Fiber.join(waitForServerStopFiber),
    Fiber.join(handleFloatingErrorsFiber),
  );
```

### Problem 2: Potential Zombie Processes

**Problem**: If HTTP server closed unexpectedly without emitting custom events, Effect would wait forever.

**Root Cause**: Relying on manually-emitted "error"/"stopped" events instead of actual system state.

**Solution**: Listen to HTTP server's native 'close' event and emit "stopped" from there

```typescript
// In NodeCGServer constructor
server.on("close", () => {
  this.emitStoppedOnce();
});
```

### Problem 3: Effect.async Fibers Not Completing

**Problem**: Cleanup ran but fiber remained suspended forever.

**Root Cause**: Cleanup (returned Effect from `Effect.async`) only removes resources, doesn't complete the fiber.

**Solution**: Must explicitly call `resume()` to complete suspended fibers

```typescript
const handleFloatingErrors = Effect.async<void, UnknownError>((resume) => {
  const handler = (err: Error) => {
    cleanup(); // Remove listeners
    resume(Effect.fail(new UnknownError(err))); // MUST call resume
  };
  // ...
  return Effect.sync(cleanup); // Cleanup for interruption
});
```

### Problem 4: OpenTelemetry Overhead in Production

**Problem**: Loading OpenTelemetry packages added overhead even when span logging was disabled.

**Root Cause**: Top-level imports and span processor class instantiation happened regardless of whether tracing was needed.

**Investigation**:

- Checked Effect.fn overhead when tracing disabled (minimal - just FiberRef check)
- Realized the overhead came from loading OpenTelemetry modules, not Effect.fn itself
- Explored alternatives: `Effect.withTracerEnabled(false)` still loads infrastructure

**Solution**: Use Config-based feature flag with dynamic imports

```typescript
export const withSpanProcessorLive = Effect.fn(function* <A, E, R>(
  effect: Effect.Effect<A, E, R>,
) {
  const enabled = yield* Config.boolean("LOG_SPAN").pipe(
    Config.withDefault(false),
  );
  if (!enabled) {
    return yield* effect; // Early return, no imports
  }

  // Only loads when LOG_SPAN=true
  const { NodeSdk } = yield* Effect.promise(
    () => import("@effect/opentelemetry"),
  );
  const { SpanStatusCode } = yield* Effect.promise(
    () => import("@opentelemetry/api"),
  );

  const runtime = yield* Effect.runtime<never>();

  const layer = NodeSdk.layer(() => ({
    resource: { serviceName: "nodecg" },
    spanProcessor: {
      onStart: (span) => {
        Runtime.runSync(runtime, Effect.logTrace(`▶️  ${span.name}`));
      },
      onEnd: (span) => {
        const formattedDuration = pipe(
          Duration.toMillis(span.duration),
          Number.round(0),
          Duration.millis,
          Duration.format,
          String.split(" "),
          Array.take(2),
          Array.join(" "),
        );
        const status = span.status.code === SpanStatusCode.ERROR ? "❌" : "✅";
        let log = `${status} ${span.name} (${formattedDuration})`;
        if (span.status.code === SpanStatusCode.ERROR) {
          log += ` ${span.status.message}`;
        }
        Runtime.runSync(runtime, Effect.logTrace(log));
      },
      forceFlush: () => Promise.resolve(),
      shutdown: () => Promise.resolve(),
    },
  }));

  return yield* Effect.provide(effect, layer);
});
```

**Benefits**:

- Zero overhead in production without `LOG_SPAN=true`
- OpenTelemetry packages never loaded into memory when disabled
- Proper Effect integration via `Effect.promise()` for dynamic imports

## Implementation

### Utility Files Created

Created `workspaces/nodecg/src/server/_effect/` directory with reusable Effect utilities:

**1. `boundary.ts`** - Error boundary for non-Effect code

- `UnknownError` - Tagged error wrapping unknown exceptions from legacy code
- Extracts error message when wrapping Error instances

**2. `expect-error.ts`** - Type utility for error handling

- `expectError<E>()` - Identity function that narrows effect error type
- Used to document expected errors at program boundaries

**3. `log-level.ts`** - Log level configuration

- `withLogLevelConfig` - Reads `LOG_LEVEL` env var and sets Effect logger level
- Defaults to `LogLevel.Info` if not specified

**4. `span-logger.ts`** - OpenTelemetry span logging

- Custom span processor that logs span start/end
- Logs span name with status emoji (▶️ for start, ✅/❌ for end)
- Includes duration formatting (rounds based on magnitude)
- `withSpanProcessorLive` - Effect.fn wrapper that captures runtime for span logging
- Uses Config-based conditional loading to avoid OpenTelemetry overhead when disabled
- Dynamic imports load telemetry packages only when `LOG_SPAN=true`

**5. `test-effect.ts`** - Vitest test helper

- `testEffect(effect)` - Wraps Effect for Vitest, handles scoping automatically
- Accepts `Effect<A, E, Scope.Scope>` and wraps with `Effect.scoped`
- Works with both `never` and `Scope` requirements
- Provide layers before passing to helper: `.pipe(Effect.provide(layer))`

### Core Implementation

**bootstrap.ts** - Complete rewrite:

```typescript
const main = Effect.fn("main")(function* () {
  const handleFloatingErrorsFiber = yield* Effect.fork(handleFloatingErrors());
  const server = yield* instantiateServer();
  const waitForServerStopFiber = yield* Effect.fork(waitForServerStop(server));

  yield* Effect.promise(() => server.start());

  yield* Effect.raceFirst(
    Fiber.join(waitForServerStopFiber),
    Fiber.join(handleFloatingErrorsFiber),
  );
}, Effect.scoped);

NodeRuntime.runMain(
  main().pipe(
    withSpanProcessorLive,
    withLogLevelConfig,
    expectError<UnknownError | ConfigError.ConfigError>(),
  ),
);
```

**server/index.ts** - Added Effect wrapper:

```typescript
export const instantiateServer = Effect.fn("instantiateServer")(() =>
  Effect.acquireRelease(
    Effect.sync(() => new NodeCGServer()),
    Effect.fn("instantiateServer/release")((server) =>
      Effect.promise(() => server.stop()),
    ),
  ),
);
```

### Dependencies Added

- **Effect**: `effect@^3.19.3`, `@effect/platform@^0.93.1`, `@effect/platform-node@^0.100.0`, `@effect/opentelemetry@^0.59.1`
- **OpenTelemetry**: `@opentelemetry/api`, `@opentelemetry/core`, `@opentelemetry/resources`, `@opentelemetry/sdk-trace-base`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/semantic-conventions`
- **Utilities**: `type-fest@^5.2.0`
- **Dev**: `@effect/language-service@^0.55.5`

## Effect Patterns Established

### Error Boundary Pattern

Wrap non-Effect errors with tagged errors at boundaries:

```typescript
export class UnknownError extends Data.TaggedError("UnknownError") {
  constructor(cause: unknown) {
    super();
    this.cause = cause;
    this.message =
      this.cause instanceof Error
        ? this.cause.message
        : "An unknown error occurred";
  }
}
```

### Lazy Runtime Capture

Use `Effect.fn` wrappers to capture runtime when called, not at module load:

```typescript
export const withSpanProcessorLive = Effect.fn(function* (effect) {
  const runtime = yield* Effect.runtime<never>(); // Capture when called
  const layer = NodeSdk.layer(() => ({
    spanProcessor: new SimpleSpanProcessor(runtime),
  }));
  return yield* Effect.provide(effect, layer);
});
```

### Long-Running Server Pattern

Use `Effect.never` for indefinite operations, `Effect.raceFirst` for error handling:

```typescript
const serverRunning = Effect.acquireRelease(
  Effect.gen(function* () {
    yield* Effect.promise(() => server.start());
    yield* Effect.never; // Runs until interrupted
    return server;
  }),
  (server) => Effect.promise(() => server.stop()),
);
```

### Effect.async with Cleanup and Resume

Must call both cleanup AND resume:

```typescript
Effect.async<void, Error>((resume) => {
  const handler = (err: Error) => {
    cleanup();
    resume(Effect.fail(err)); // MUST call to complete fiber
  };
  process.on("error", handler);
  return Effect.sync(cleanup); // For interruption
});
```

### Dynamic Import Pattern for Optional Features

Use dynamic imports within Effect.fn to conditionally load heavy dependencies:

```typescript
const enabled =
  yield * Config.boolean("FEATURE_FLAG").pipe(Config.withDefault(false));
if (!enabled) {
  return yield * effect; // Early return, no imports
}

// Only loads when enabled
const { Module } = yield * Effect.promise(() => import("heavy-package"));
```

**Benefits**:

- Zero overhead when disabled (no module loading or parsing)
- Proper Effect integration with error handling
- Type-safe dynamic imports

## Lessons Learned

### Effect Semantics

- **Effect.race vs Effect.raceFirst**: `race` waits for first success, `raceFirst` waits for first completion. Use `raceFirst` when racing error handlers with indefinite operations.
- **Effect.async suspension**: Cleanup removes resources but doesn't complete the fiber. Must call `resume()` explicitly.
- **Effect.scoped**: Required when using `Effect.acquireRelease` before passing to `runMain`.

### Runtime and Context

- **Never execute Effect at module top-level**: Always wrap in `Effect.fn` to capture context lazily.
- **Runtime snapshots include FiberRefs**: Runtime captured via `Effect.runtime()` includes all current FiberRef values (log level, spans, etc.).
- **Composition order matters**: When piping effects, order determines FiberRef values captured in runtime snapshots.

### Long-Running Servers

- **Use Effect.never**: Servers run indefinitely, not for a timeout period.
- **Listen to native events**: System events (HTTP 'close') are more reliable than manual notifications.
- **Avoid arbitrary timeouts**: Timeouts are for operations with expected completion time, not servers.

### OpenTelemetry Integration

- **SpanProcessor vs SpanExporter**: Use `SpanProcessor` for lifecycle hooks (`onStart`, `onEnd`), not `SpanExporter` (only receives finished spans).
- **Runtime needed for Effect logging**: Span processors need runtime to use Effect's logging system.
- **Duration formatting**: Use Effect's Duration module with conditional rounding based on magnitude.
- **HrTime compatibility**: OpenTelemetry's `HrTime` type (`[number, number]`) is directly compatible with Effect's `DurationInput` type - no conversion needed.
- **Conditional loading**: Use Config + dynamic imports to avoid loading OpenTelemetry when disabled (zero overhead in production).
- **Effect.fn overhead when tracing disabled**: Minimal - just checks `currentTracerEnabled` FiberRef and creates noop span object.

### Debugging

- **Read library source code**: When behavior is unclear, source code reveals exact mechanics (Effect's fiberRuntime.ts showed why race hung).
- **Add extensive logging**: Trace execution flow to understand what's happening vs. what should happen.
- **Check Effect internals**: Messages like "Fiber terminated with an unhandled error" indicate Effect detected an issue.

## Architecture Changes

**Removed**:

- `util/exit-hook.ts` - No longer needed with Effect's built-in lifecycle management

**Modified**:

- `bootstrap.ts` - Complete rewrite using Effect
- `server/index.ts` - Added `instantiateServer` wrapper, zombie process prevention (`emitStoppedOnce`)
- `config/index.ts` - Added TODO to remove Sentry flag in next major release

**Added**:

- `_effect/boundary.ts` - Error boundary utilities
- `_effect/expect-error.ts` - Type utilities
- `_effect/log-level.ts` - Log level configuration
- `_effect/span-logger.ts` - OpenTelemetry integration

**Tooling**:

- `scripts/workspaces-parallel.ts` - Changed from `node --run` to `npm run` for compatibility
- `.node-version` - Set to Node 20

## Next Steps

- [x] Phase 1: Server Entry Point - ✅ COMPLETE
- [ ] Phase 2: Core Services - Extract Config, Database, Bundles as Effect services
- [ ] Phase 3: HTTP Server Integration - Effect HTTP Router with Express fallback
- [ ] Phase 4: Route Handlers - Convert Express routes to Effect HTTP Router
- [ ] Phase 5: Utility Functions - Migrate supporting functions

## Files Modified

- `workspaces/nodecg/src/server/bootstrap.ts`
- `workspaces/nodecg/src/server/server/index.ts`
- `workspaces/nodecg/src/server/config/index.ts`
- `workspaces/nodecg/src/server/_effect/boundary.ts` (new)
- `workspaces/nodecg/src/server/_effect/expect-error.ts` (new)
- `workspaces/nodecg/src/server/_effect/log-level.ts` (new)
- `workspaces/nodecg/src/server/_effect/span-logger.ts` (new)
- `workspaces/nodecg/src/server/_effect/test-effect.ts` (new)
- `workspaces/nodecg/package.json`
- `package.json`
- `scripts/workspaces-parallel.ts`
- `.node-version` (new)
- `util/exit-hook.ts` (deleted)
