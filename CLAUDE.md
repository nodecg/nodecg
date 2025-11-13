# NodeCG

## Project Overview

NodeCG is a broadcast graphics framework. This codebase includes:

- Core server (`src/server`)
- CLI tools (`workspaces/cli`)
- E2E tests using Puppeteer
- Vitest 3.0.2 test framework

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

### Monorepo Command Execution

- **ALWAYS work from monorepo root** (`/Users/hoishin/work/nodecg__nodecg2`) - never `cd` into workspaces
- Run workspace-specific commands: `npm run build --workspace=@nodecg/cli`
- Install in workspace: `npm i package@latest --workspace=@nodecg/cli`
- Run tests from root: `npx vitest run workspaces/cli/src/commands/defaultconfig.test.ts`
- Lint/fix from root: `npm run fix` (applies to all workspaces)

## Codebase Patterns

### Imports

- Use `node:` prefix for Node.js built-ins: `import fs from "node:fs"`
- Workspace packages: `@nodecg/internal-util`, `@nodecg/database-adapter-sqlite-legacy`
- TypeScript: CommonJS (`module: "commonjs"`), ES2022 target

### Module Resolution

- **Always use `.js` extensions** in imports, even for `.ts` source files
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
- In-memory database: `:memory:` SQLite per worker process
- Temp directories: Unique per test file via `mkdtempSync(tmpdir() + "/")`
- Process isolation: Vitest `forks` pool (separate Node.js processes)

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
- **CLI workspace already migrated**: `workspaces/cli` is fully Effect-native with DI-based testing

**Effect Conventions**:

- Top-level imports only: `"effect"`, `"@effect/platform"` (not subpaths)
- Schemas suffix with `Schema`: `ConfigSchema` → `type Config`
- Use `yield* Effect.log*()` for app logs, `yield* Console.*()` for debugging
- Always use `Effect.fn("name")` for effect-returning functions (never `Effect.gen` for definitions)
- Services created with `Effect.Service` (never Context API directly)
- **Tests use `@effect/vitest`** for Effect testing utilities (NOT plain vitest)
- **Test files co-located**: Always place `.test.ts` files next to source files, not in separate `test/` directory
- Install Effect packages with `npm i @effect/package@latest` in workspace (never edit package.json directly)
- No return type annotations (let TypeScript infer), no `any`, no type assertions
- **Exception**: Add explicit type annotations for recursive functions to avoid "implicitly has type 'any'" errors
- See `docs/effect-migration/strategy.md` for comprehensive coding guidelines

**CLI Testing with Effect**:

- **MUST use `@effect/vitest`** for all Effect-based tests
- Mock services use `Effect.Service.make()` to create instances
- Use `createTestLayer()` to compose mock service layers
- **Test runner must provide platform layers** - NodeContext.layer provides CommandExecutor and other platform dependencies
- Mock service layers that wrap real services (Git, Npm) need `Layer.merge` with their dependencies (CommandService)
- For generic methods (like `readJson<A>`), return `any` in mocks - TypeScript can't properly type these
- **Use `Layer.mergeAll(...layers)`** for combining multiple layers - it's the correct Effect-TS API (production code in `bin/nodecg.ts` uses this)
- Helper functions that accept rest parameters need `as any` cast: `Layer.mergeAll(...(layers as any))` due to TypeScript spread limitations

**Test Pattern with @effect/vitest**:

```typescript
import { it } from "@effect/vitest";

it.effect("should do something",
  Effect.fn(function* () {
    const service = yield* MyService;
    yield* service.doSomething();
    expect(result).toBe(expected);
  }, Effect.provide(MockServiceLayer()))
);
```

- Use `it.effect()` with `Effect.fn()` (not `Effect.gen().pipe()`)
- Effect.fn can be nameless and takes generator as first arg
- Additional functions (Effect.provide, etc.) passed as 2nd/3rd... params like pipe
- Assertions go inside the generator function
- Empty Effect functions cause eslint errors - use `Effect.succeed(value)` or `Effect.void` instead of `function* () {}`

**Migration Documentation**:

- All migration work must be logged in `docs/effect-migration/log.md`
- Log decisions, problems/solutions, patterns used, and lessons learned
- See `docs/effect-migration/strategy.md` for migration approach and candidates

**Existing fp-ts Code**:

- `src/server/bundle-parser/` already uses fp-ts (IOEither, pipe, flow)
- Migration from fp-ts → Effect is translation, not rewrite
- Good reference for functional patterns in the codebase

**Applying Changes to Migrated Code**:

- When porting changes from main branch (non-Effect) to migrated branches, translate patterns:
  - Direct function calls → `yield* service.method()`
  - Try/catch → `Effect.catchAll()` or proper error handling
  - Plain objects in tests → Mock service layers with DI
  - Helper functions → `Effect.fn("name")` definitions

## Common Pitfalls

- Missing `.js` extension in imports (causes module resolution errors)
- Not running `npm run build` before tests (workspace packages export from `dist/`)
- Using `npm test` instead of `npx vitest run` (wrong test runner)
- Sharing state between test files (each file must be isolated)
- Forgetting that array/object access returns `T | undefined` (`noUncheckedIndexedAccess`)
- Importing NodeCG modules before setting `NODECG_ROOT` env var (causes wrong root path to be cached)
- **Effect-TS recursion**: Recursive Effect.fn functions cause "implicitly has type 'any'" - add explicit type annotation
- **Effect service dependencies**: Services using @effect/platform commands need NodeContext.layer in tests for CommandExecutor
- **Mock layer dependencies**: When mocking services that depend on other services, use `Layer.merge` to provide dependencies
