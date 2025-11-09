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
- **Build output**: `workspaces/nodecg/out/` (server/client), `workspaces/nodecg/dist/` (client bundles)
- **Root**: Minimal wrapper with `nodecgDevelopment: true` field, `index.js` wrapper pointing to workspace

## Build System

- `npm run build` compiles TypeScript (`tsc`) and bundles client assets for all workspaces
- **Output**: `workspaces/nodecg/out/` (compiled TS as CommonJS), `workspaces/nodecg/dist/` (client bundles)
- **Required before tests**: Tests import from compiled `out/` directory
- Build errors block test execution
- **First build may need two runs** - workspace dependencies may not be ready on first pass

## Test Infrastructure

### Configuration

- **Vitest config**: `vitest.config.mts` (base config at root)
- **E2E tests**: Run serially to avoid Puppeteer resource exhaustion
- **Unit tests**: Run in parallel (Vitest auto-scales based on CPU cores)
- **Test setup**: `workspaces/nodecg/test/helpers/setup.ts` creates isolated temp directories per test file
- **E2E fixtures**: Browser pages are lazy-loaded and reused within test file
- **Working directory**: Vitest runs from repo root, so all test paths must be `workspaces/nodecg/test/...`

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

### Build/Test Workflow

1. `npm install` - Install dependencies
2. `npm run build` - Build before testing
3. `npx vitest run` - Run tests in CI mode (not `npm test`)

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

- **Legacy mode (development)**: Root package has `nodecgDevelopment: true`, bundles in `bundles/` directory
- **Installed mode**: NodeCG installed as dependency in `node_modules`, project root IS the bundle
- Mode determined by `isLegacyProject` check (`package.json` has `nodecgDevelopment: true`)
- **Critical**: `@nodecg/internal-util` caches `rootPath` and `isLegacyProject` at module load time
- Tests must set `process.env.NODECG_ROOT` BEFORE importing any NodeCG modules
- Use `getNodecgRoot()` function (respects NODECG_ROOT) instead of `rootPath` constant where appropriate

## Common Pitfalls

- Missing `.js` extension in imports (causes module resolution errors)
- Not running `npm run build` before tests (tests import stale/missing code)
- Using `npm test` instead of `npx vitest run` (wrong test runner)
- Sharing state between test files (each file must be isolated)
- Forgetting that array/object access returns `T | undefined` (`noUncheckedIndexedAccess`)
- Importing NodeCG modules before setting `NODECG_ROOT` env var (causes wrong root path to be cached)
