# NodeCG

## Project Overview

NodeCG is a broadcast graphics framework. This codebase includes:

- Core server (`src/server`)
- CLI tools (`workspaces/cli`)
- E2E tests using Puppeteer
- Vitest 4.x test framework (currently without @effect/vitest due to peer dependency conflicts)

## Project Structure

- **Workspaces**: `workspaces/*` (nodecg, internal-util, database-adapters, cli)
  - Main package is in `workspaces/nodecg/`
- **Source**: `workspaces/nodecg/src/{server,client,shared}`
- **Tests**: `workspaces/nodecg/test/**/*.test.ts` (E2E), `workspaces/nodecg/src/**/*.test.ts` (unit)
- **Build output**: `workspaces/nodecg/dist/` (bundled server/client code)
- **Root**: Minimal wrapper with `nodecgRoot: true` field, `index.js` wrapper pointing to workspace

## Build System

- `npm run build` uses `tsdown` bundler to compile and bundle all workspaces
- **Output**: `workspaces/nodecg/dist/` (bundled server and client code as CommonJS)
- **Required before tests**: Workspace packages must be built as tests import from their `dist/` directories
- Build errors block test execution

## Test Infrastructure

### Configuration

- **Vitest config**: `vitest.config.mts` (base config at root)
- **E2E tests**: Run serially to avoid Puppeteer resource exhaustion
- **Unit tests**: Run in parallel (Vitest auto-scales based on CPU cores)
- **Test setup**: `workspaces/nodecg/test/helpers/setup.ts` creates isolated temp directories per test file
- **E2E fixtures**: Browser pages are lazy-loaded and reused within test file
- **Working directory**: Vitest runs from repo root, so all test paths must be `workspaces/nodecg/test/...`

### Test Fixtures

- **Location**: `workspaces/nodecg/test/fixtures/nodecg-core/`
- **Test fixtures are version controlled**: node_modules in test fixtures are tracked by git
- **Gitignore patterns**: `.gitignore` has negation patterns for test fixtures:
  - `!**/test/**/node_modules/` - un-ignores node_modules in test directories
  - `!**/test/**/node_modules/**/dist/` - un-ignores dist directories inside test node_modules
- **Creating test packages**: When adding fixture packages, verify they're not gitignored with `git check-ignore -v <path>`

### Key Test Helpers

- `workspaces/nodecg/test/helpers/setup.ts`: Creates NodeCG server + Puppeteer browser per test file
- Each test file gets its own server instance, temp directory, and in-memory database
- Browser pages are shared within a test file but not across files
- Fixture paths in tests must be relative to repo root: `workspaces/nodecg/test/fixtures/...`
- **Test wrapper pattern**: Uses Promise-based wrapper (`TestServerWrapper`) around Effect-based server for backward compatibility
- Tests access internal instances via `server.handle.bundleManager`, not type casting

### Common Test Patterns

- **Browser access**: `const { page } = await getPageInfo()` (lazy-loads browser)
- **Server URL**: `server.getUrl()` or `server.getUrl('/path')`
- **Waiting for changes**: Use Puppeteer's `page.waitForSelector()`, `page.waitForFunction()`
- **Client-side evaluation**: `await page.evaluate(() => { ... })`

### Test Coverage Guidelines

- **Test nested paths thoroughly**: Express route parameters need tests for deeply nested paths (3+ levels)
- **Test scoped packages**: Always include `@scope/package/file.js` patterns in route tests
- **Dashboard routes**: `/node_modules/` route serves from nodecg installation to bundles
- **Graphics routes**: `/bundles/:bundle/node_modules/` serves from bundle's own node_modules
- **Legacy vs installed mode**: Test both modes separately as they have different node_modules resolution

### Build/Test Workflow

1. `npm install` - Install dependencies
2. `npm run build` - Build workspace packages before testing
3. `npx vitest run` - Run tests in CI mode (not `npm test`)

## Codebase Patterns

### Imports

- Use `node:` prefix for Node.js built-ins: `import fs from "node:fs"`
- Workspace packages: `@nodecg/internal-util`, `@nodecg/database-adapter-sqlite-legacy`
- TypeScript: CommonJS (`module: "commonjs"`), ES2022 target

### Module Resolution

- **Always use `.js` extensions** in imports, even for `.ts` source files (applies to both production and test code)
- Workspace packages (`@nodecg/*`) resolve via npm workspaces
- Source uses ESM-style imports, compiled output is CommonJS
- Tests import from compiled `out/` directory (CommonJS modules)

### TypeScript Configuration

- Strict mode enabled
- `noUncheckedIndexedAccess: true` - array/object access returns `T | undefined`
- `noUnusedLocals` and `noUnusedParameters` enabled
- Project references: `src/server`, `src/client` built separately

### Test Isolation

- Dynamic port allocation: `process.env.NODECG_TEST` → OS assigns random port
- `NODECG_TEST_PORT` set in server listen callback - tests depend on this for URL construction
- In-memory database: `:memory:` SQLite per worker process
- Temp directories: Unique per test file via `mkdtempSync(tmpdir() + "/")`
- Process isolation: Vitest `forks` pool (separate Node.js processes)

### Test Naming Conventions

- **Use `test()` not `it()`** - Prefer `test("description", ...)` over `it("description", ...)` for test definitions
- Effect tests still use `testEffect()` helper but with `test()` as the outer function

## Vitest Gotchas

### vi.mock() Hoisting

- `vi.mock()` is hoisted to top of file
- Cannot reference variables/functions outside the mock callback
- **Solution**: Use `async (importOriginal)` parameter to get actual implementation
- **Type safety**: `await importOriginal<typeof import("module-name")>()`

### Side-Effect Mock Pattern

```typescript
// In mock file (e.g., test/mocks/foo-mock.ts)
import { vi } from "vitest";
vi.mock("module-name", async (importOriginal) => { ... });

// In test file
import "../../test/mocks/foo-mock.js"; // Side-effect import
```

### Mocking fetch()

- Mock `globalThis.fetch` to intercept HTTP requests in tests
- Avoid real network calls - they cause flaky/slow tests
- **Response mock pattern**: Return plain object with Node.js stream as `body`, typed as `unknown as Response`
  - Using `new Response()` converts Node streams to Web ReadableStream
  - Web ReadableStream may not work properly with Node.js `stream.pipeline()`
  - Keeping Node.js Readable stream in mock body works with pipeline
- **Tar archives in mocks**: Use `tar.create()` with gzip, convert to stream with `Readable.from(buffer)`

### Mocking Child Processes

- Mock `child_process.spawn`/`fork` to avoid spawning real processes in tests
- Use `EventEmitter` to simulate child process events (`exit`, `error`)
- Mock stdio streams (`stdin`, `stdout`, `stderr`) as Readable/Writable streams
- Common pattern: Return mock child immediately, emit events asynchronously

### globalSetup Limitations

- Runs in separate Node process
- Can only share serializable data via `provide()`
- Cannot share: servers, browsers, database connections, class instances
- Use per-file setup instead for E2E infrastructure

## Debugging Tips

- **Run single test**: `npx vitest run path/to/test.ts`
- **Watch mode**: `npx vitest` (re-runs on file changes)
- **Filter by name**: `npx vitest run -t "test name pattern"`
- **Read entire error output carefully** - includes stdout, stderr, and multiple test failures that reveal patterns
- **Compare passing vs failing tests** - look for differences in test output/behavior to identify root cause
- **Puppeteer debugging**: Set `headless: false`, `slowMo: 100` in browser launch options
- **Check diagnostics**: Use `mcp__ide__getDiagnostics` to see type errors before running tests

## NodeCG Architecture

### Legacy vs Installed Mode

- **Legacy mode**: Root package has `nodecgRoot: true`, bundles in `bundles/` directory
- **Installed mode**: NodeCG installed as dependency in `node_modules`, project root IS the bundle
- Mode determined by `isLegacyProject` check (`package.json` has `nodecgRoot: true`)
- **Critical**: `@nodecg/internal-util` caches `rootPath` and `isLegacyProject` at module load time
- Tests must set `process.env.NODECG_ROOT` BEFORE importing any NodeCG modules
- Use `getNodecgRoot()` function (respects NODECG_ROOT) instead of `rootPath` constant where appropriate

## Effect-TS Migration

NodeCG is incrementally migrating to Effect-TS. See `docs/effect-migration/` for strategy and plans.

**Migration Strategy**:

- **Within packages**: Root-to-leaf (top-down) - single execution point at package boundary
- **Across codebase**: Leaf-to-root (bottom-up) - extract isolated subsystems as workspace packages first
- Each new package is fully Effect-native internally, called via `Effect.run*` from old code
- Candidates listed in `docs/effect-migration/strategy.md` with complexity ratings

**Effect Conventions**:

- Top-level imports only: `"effect"`, `"@effect/platform"` (not subpaths)
- Schemas suffix with `Schema`: `ConfigSchema` → `type Config`
- Use `yield* Effect.log*()` for app logs, `yield* Console.*()` for debugging
- Always use `Effect.fn("name")` for effect-returning functions (never `Effect.gen` for definitions)
- **No classes in Effect** - use plain functions, not class-based architecture
- Services created with `Effect.Service` (never Context API directly)
- **Testing**: Use `testEffect()` helper from `src/server/_effect/test-effect.ts` for running Effect tests in Vitest
  - Helper accepts `Effect<A, E, Scope.Scope>` and wraps with `Effect.scoped`
  - Works with both `never` and `Scope` requirements
  - Provide layers before passing to helper: `.pipe(Effect.provide(layer))`
- Install Effect packages with `npm i @effect/package@latest` in workspace (never edit package.json directly)
- No return type annotations (let TypeScript infer), no `any`, no type assertions
- See `docs/effect-migration/strategy.md` for comprehensive coding guidelines

**Effect Layer Patterns**:

- **Avoid top-level Effect execution**: Never use `Layer.unwrapEffect` at module top-level
- **Lazy layer construction**: Use `Effect.fn` wrappers that capture runtime/context when called, not at module load
- **Pattern**: `export const withXLive = Effect.fn(function* (effect) { ... yield* Effect.runtime() ... })`
- **OpenTelemetry integration**: Span exporter needs runtime for Effect logging - capture via Effect.fn wrapper

**Effect Patterns for Long-Running Servers**:

- Use `Effect.async` to wait for server close/error, NOT `Effect.never`
- Listen to native events (e.g., HTTP server's 'close', 'listening') instead of manually-emitted events for reliability
- Use `Effect.raceFirst` (NOT `Effect.race`) when racing error handlers with indefinite operations
  - `Effect.race` waits for first SUCCESS; hangs if one fails and one never completes
  - `Effect.raceFirst` completes on first completion (success OR failure)
- `Effect.async` suspension: Must call `resume()` to complete fiber; cleanup alone doesn't complete suspended fibers
- Avoid arbitrary timeouts for servers - they should run forever, not timeout
- When migrating from event-driven code, identify which events represent actual system state vs. manual notifications
- **Separate create from run**: Return handle with resources + `run` Effect for external access pattern
- **Distribute cleanup**: Use separate `Effect.acquireRelease` for each resource instead of monolithic cleanup
- **Readiness signaling**: Accept optional `Deferred` parameter to signal completion; succeed it in callbacks when operation completes
- **Bridging native callbacks to Effect**: Capture runtime with `yield* Effect.runtime()` before callback, use `Runtime.runSync(runtime, effect)` inside callback
- **Test wrapper pattern**: When migrating class-based servers to Effect, create Promise-based wrapper that manages Effect fibers internally for backward compatibility
- **Scope at call site**: Apply `Effect.scoped` in the caller (bootstrap, tests), not in resource creation functions - cleanup happens when outer scope closes
- **Fork scoped listeners**: Use `Effect.forkScoped` to fork event listeners so they auto-cleanup when scope closes
- **Daemon fibers for long-running servers**: Use `Effect.forkDaemon` (NOT `Effect.fork`) when forking server Effects that must survive parent Effect completion
  - `Effect.fork` creates child fibers that are interrupted when parent completes
  - `Effect.forkDaemon` creates daemon fibers that continue running after parent completes
  - Essential for test setups where server must stay alive after ready signal

**Effect Event Listener Patterns**:

- **Eager vs Lazy Setup**:
  - `Effect.async` runs setup eagerly when Effect is yielded
  - `Stream.async`/`Stream.asyncPush` run setup lazily when stream is consumed
  - For event listeners that must be registered immediately, use `Effect.gen` returning `Stream`, not bare `Stream` constructor
- **One-time events**: Use `Effect.async<T>` with `eventEmitter.once()` for single-fire events
- **Continuous events**: Use `Effect.gen(function* () { ... return Stream.fromQueue(queue) })` pattern
  - Create bounded queue inside Effect.gen
  - Register listener that offers to queue
  - Register finalizer to remove listener
  - Return Stream from queue
- **Forking listener setup**: Run listener registration in main fiber before forking stream consumption
  - Wrong: `yield* Effect.forkScoped(Effect.all([...listeners]).pipe(...))`
  - Right: `const streams = yield* Effect.all([...listeners]); yield* Effect.forkScoped(Stream.runForEach(...))`
- **Fiber execution model**: `Effect.forkScoped` creates a forked fiber that runs concurrently
  - The forked fiber runs in the background, attached to the current scope
  - Control returns to the main fiber after any synchronous portion of the forked effect
  - Code after `yield* Effect.forkScoped(...)` runs concurrently with the forked fiber
  - If listener registration is inside the fork, race conditions can occur
- **Queue-based event streams**: Pattern for bridging EventEmitter → Stream
  - Create bounded queue (`Queue.bounded<T>(100)`)
  - Register EventEmitter listener that offers to queue (`Queue.unsafeOffer`)
  - Register finalizer to remove listener when scope closes (`Effect.addFinalizer`)
  - Return `Stream.fromQueue(queue)` for consumption
  - Ensures backpressure handling, automatic cleanup, and eager listener registration
- **eventEmitter.once() auto-cleanup**: `once()` automatically removes listener after firing
  - No need for manual cleanup in the success path when using with `Effect.async`
  - Only need cleanup handler for interruption cases (return value from `Effect.async`)
- **EventEmitterLike interface**: Use generic interface instead of concrete `EventEmitter` type
  - Enables broader compatibility (works with any object implementing the interface)
  - Allows testing with custom implementations
  - Type parameter `T extends any[]` enables type-safe event payloads
- **Event emission verification**: When events are defined in EventMap, verify they're actually emitted in relevant methods

**Effect Utilities Available**:

- **EventEmitter utilities** (`src/server/_effect/event-listener.ts`):

  - `waitForEvent<T>(emitter, eventName)` - One-time events as Effect
  - `listenToEvent<T>(emitter, eventName)` - Continuous events as Effect<Stream>
  - Returns event payloads as tuples for multi-arg events

- **Chokidar wrapper** (`src/server/_effect/chokidar.ts`):

  - `getWatcher(paths, options)` - Scoped file watcher with auto-cleanup
  - `waitForReady(watcher)` - Returns tagged `FileEvent.ready` event
  - `listenToAdd/Change/AddDir/Unlink/UnlinkDir/Error(watcher)` - Type-safe event streams
  - All return `Effect<Stream<FileEvent>>` with tagged union types
  - Multi-arg events transformed via tuple destructuring: `Stream.map(([path, stats]) => fileEvent.add({ path, stats }))`

- **Test helpers** (`src/server/_effect/test-effect.ts`):
  - `testEffect(effect)` - Wraps Effect for Vitest, handles scoping automatically
  - Use `@effect/platform` FileSystem service with `NodeFileSystem.layer` for filesystem operations in tests
  - `Chunk.head` pattern for getting first stream element (avoids array indexing with `noUncheckedIndexedAccess`)

**Migration Documentation**:

- All migration work must be logged in `docs/effect-migration/log/` directory
- **Document plans BEFORE implementation** - create log entry with detailed plan, then update during work
- Each log entry is numbered sequentially: `##-brief-description.md`
- Log structure: Plans → Decisions → Problems/Solutions → Patterns → Lessons Learned → Status
- See `docs/effect-migration/strategy.md` for migration approach and phases
- See `docs/effect-migration/log/README.md` for log template and guidelines
- **Update both log and strategy docs** - When completing migration phases, update both the detailed log entry AND the phase summary in strategy.md to reflect actual implementation
- **Concise documentation style**:
  - Show function signatures, not full implementations with JSDoc
  - Reference actual implementation files instead of duplicating code
  - Avoid verbose code blocks - keep documentation scannable
- **Log consolidation**: When work is prerequisite for a phase, document it in that phase's log file, not a separate entry

**Public API Preservation**:

- Distinguish between **internal** and **public** APIs when refactoring
- Check `docs/` directory (in separate `/nodecg/docs` repo) for documented APIs before removing
- Example: ExtensionManager's `emitToAllInstances()` broadcasts are public API for bundle extensions
- Verify external usage by searching documentation, not just internal code references

**Existing fp-ts Code**:

- `src/server/bundle-parser/` already uses fp-ts (IOEither, pipe, flow)
- Migration from fp-ts → Effect is translation, not rewrite
- Good reference for functional patterns in the codebase

## OpenTelemetry Integration

- **Required packages**: `@effect/opentelemetry`, `@opentelemetry/sdk-trace-base`, `@opentelemetry/core`, `@opentelemetry/sdk-logs`, `@opentelemetry/sdk-metrics`, `@opentelemetry/sdk-trace-node`, `@opentelemetry/api`, `@opentelemetry/resources`, `@opentelemetry/semantic-conventions`, `@opentelemetry/sdk-trace-web`, `@opentelemetry/context-zone`, `@opentelemetry/instrumentation`
- **Automatic span logging**: `Effect.fn("name")` automatically creates spans when OpenTelemetry is configured
- **Span names**: First argument to `Effect.fn` becomes the span name (e.g., `Effect.fn("main")`)
- **Runtime capture**: SpanExporter needs Effect Runtime to use Effect logging - capture via `Effect.runtime<never>()` inside Effect.fn wrapper
- **Entry point**: `workspaces/nodecg/index.js` (not dist/index.js)

### Custom Span Processors

- **SpanProcessor vs SpanExporter**: Use `SpanProcessor` interface for lifecycle hooks (`onStart`, `onEnd`), not `SpanExporter` (only gets finished spans)
- **Logging both start and end**: Implement `onStart()` for span begin, `onEnd()` for completion with duration
- **Status codes**: Use `SpanStatusCode` enum from `@opentelemetry/api` (UNSET=0, OK=1, ERROR=2), not raw numbers
- **Direct processor usage**: Pass processor directly to `spanProcessor` config, skip `BatchSpanProcessor` wrapper for immediate logging
- **HrTime format**: `span.duration` is `[seconds, nanoseconds]` tuple - Effect's `Duration.toMillis()` accepts this format directly
- **Duration compatibility**: Effect's `DurationInput` type accepts `readonly [seconds: number, nanos: number]`, matching OpenTelemetry's HrTime
- **Duration formatting**: Use `Duration.format()` for human-readable output; round conditionally based on magnitude
- **Conditional loading**: Use `Config.boolean("LOG_SPAN")` with dynamic imports to avoid loading OpenTelemetry when disabled
- **Reference**: See `workspaces/nodecg/src/server/_effect/span-logger.ts` for example implementation

## Common Pitfalls

- Missing `.js` extension in imports (causes module resolution errors)
- Not running `npm run build` before tests (workspace packages export from `dist/`)
- Using `npm test` instead of `npx vitest run` (wrong test runner)
- Sharing state between test files (each file must be isolated)
- Forgetting that array/object access returns `T | undefined` (`noUncheckedIndexedAccess`)
- Importing NodeCG modules before setting `NODECG_ROOT` env var (causes wrong root path to be cached)
