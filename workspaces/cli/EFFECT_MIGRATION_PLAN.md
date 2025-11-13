# Effect Migration Plan for @nodecg/cli

## Overview

This document outlines the complete migration plan for `@nodecg/cli` from imperative code with Commander.js to a fully functional Effect-based implementation using `@effect/cli`.

## Goals

- ✅ Full feature parity with current CLI
- ✅ Strict typing (no `any`, no type assertions)
- ✅ Use `Effect.fn("name")(function* () {})` pattern throughout
- ✅ Use `Effect.Service` for all service definitions
- ✅ Import only from library roots (no subpath imports)
- ✅ Proper dependency injection via Layer system
- ✅ Testable architecture with service mocking

---

## 1. Architecture Overview

### Services: 9 Total

| #   | Service                | Purpose                                   | Dependencies                |
| --- | ---------------------- | ----------------------------------------- | --------------------------- |
| 1   | FileSystemService      | File I/O, JSON read/write, tar extraction | `FileSystem.FileSystem`     |
| 2   | TerminalService        | Terminal I/O, colors, prompts             | `Terminal.Terminal`         |
| 3   | HttpService            | HTTP requests, JSON fetching, streams     | `HttpClient.HttpClient`     |
| 4   | CommandService         | Process spawning and execution            | `Command` (platform)        |
| 5   | GitService             | Git operations (clone, checkout, tags)    | CommandService              |
| 6   | NpmService             | NPM operations (versions, install)        | HttpService, CommandService |
| 7   | JsonSchemaService      | JSON Schema validation, defaults, TS gen  | FileSystemService           |
| 8   | PackageResolverService | Parse package specs to git URLs           | (pure libraries)            |
| 9   | PathService            | NodeCG-specific path utilities            | FileSystemService           |

### Pure Utilities

- `semver.ts` - Pure functions wrapping semver library (NOT a service)

---

## 2. Service APIs

### FileSystemService

Wraps `FileSystem.FileSystem` with domain-specific error handling.

**Methods:**

```typescript
readJson<A>(path: string, schema: Schema.Schema<A, unknown>): Effect<A, FileSystemError>
writeJson<A>(path: string, data: A): Effect<void, FileSystemError>
exists(path: string): Effect<boolean, never>
mkdir(path: string, options?: { recursive?: boolean }): Effect<void, FileSystemError>
rm(path: string, options?: { recursive?: boolean; force?: boolean }): Effect<void, FileSystemError>
readdir(path: string): Effect<ReadonlyArray<string>, FileSystemError>
readFileString(path: string): Effect<string, FileSystemError>
writeFileString(path: string, content: string): Effect<void, FileSystemError>
extractTarball(stream: Stream<Uint8Array>, options?: { cwd?: string; strip?: number }): Effect<void, FileSystemError>
```

**Error Type:**

```typescript
class FileSystemError extends Data.TaggedError("FileSystemError")<{
  readonly message: string
  readonly path?: string
}>
```

---

### TerminalService

Wraps `Terminal.Terminal` with ANSI color helpers and prompts.

**Methods:**

```typescript
write(message: string): Effect<void, never>
writeLine(message: string): Effect<void, never>
writeSuccess(message: string): Effect<void, never>
writeError(message: string): Effect<void, never>
writeInfo(message: string): Effect<void, never>
writeColored(message: string, color: "green" | "red" | "cyan" | "magenta"): Effect<void, never>
confirm(message: string): Effect<boolean, TerminalError>
readLine(): Effect<string, TerminalError>
```

**Error Type:**

```typescript
class TerminalError extends Data.TaggedError("TerminalError")<{
  readonly message: string
}>
```

---

### HttpService

Wraps `HttpClient.HttpClient` with typed JSON fetching and schema validation.

**Methods:**

```typescript
fetchJson<A>(url: string, schema: Schema.Schema<A, unknown>): Effect<A, HttpError>
fetchStream(url: string): Effect<Stream<Uint8Array>, HttpError>
fetch(url: string): Effect<HttpClientResponse, HttpError>
```

**Error Type:**

```typescript
class HttpError extends Data.TaggedError("HttpError")<{
  readonly message: string
  readonly url?: string
  readonly statusCode?: number
}>
```

---

### CommandService

Wraps platform `Command` for unified process spawning.

**Methods:**

```typescript
exec(cmd: string, args: ReadonlyArray<string>, options?: { cwd?: string }): Effect<void, CommandError>
string(cmd: string, args: ReadonlyArray<string>, options?: { cwd?: string }): Effect<string, CommandError>
```

**Error Type:**

```typescript
class CommandError extends Data.TaggedError("CommandError")<{
  readonly message: string
  readonly command: string
  readonly exitCode?: number
}>
```

---

### GitService

Domain-specific git operations.

**Methods:**

```typescript
checkAvailable(): Effect<void, GitError>
clone(url: string, destination: string): Effect<void, GitError>
checkout(version: string, cwd: string): Effect<void, GitError>
listRemoteTags(repoUrl: string): Effect<ReadonlyArray<string>, GitError>
```

**Dependencies:** CommandService

**Error Type:**

```typescript
class GitError extends Data.TaggedError("GitError")<{
  readonly message: string
  readonly operation: string
}>
```

---

### NpmService

Domain-specific npm operations.

**Methods:**

```typescript
listVersions(packageName: string): Effect<ReadonlyArray<string>, NpmError>
getRelease(packageName: string, version: string): Effect<NpmRelease, NpmError>
install(cwd: string, production: boolean): Effect<void, NpmError>
yarnInstall(cwd: string, production: boolean): Effect<void, NpmError>
```

**Types:**

```typescript
type NpmRelease = {
  dist: {
    tarball: string;
  };
};
```

**Dependencies:** HttpService, CommandService

**Error Type:**

```typescript
class NpmError extends Data.TaggedError("NpmError")<{
  readonly message: string
  readonly operation: string
}>
```

---

### JsonSchemaService

JSON Schema validation, default application, and TypeScript generation.

**Methods:**

```typescript
applyDefaults(schemaPath: string): Effect<unknown, JsonSchemaError>
validate(data: unknown, schemaPath: string): Effect<void, JsonSchemaError>
compileToTypeScript(schemaPath: string, outputPath: string, options?: CompileOptions): Effect<void, JsonSchemaError>
```

**Dependencies:** FileSystemService

**Libraries Used:**

- `ajv` - JSON Schema validation and default application
- `json-schema-to-typescript` - TypeScript definition generation

**Error Type:**

```typescript
class JsonSchemaError extends Data.TaggedError("JsonSchemaError")<{
  readonly message: string
  readonly schemaPath?: string
}>
```

---

### PackageResolverService

Parse npm package specs and resolve to git URLs.

**Methods:**

```typescript
resolveGitUrl(spec: string): Effect<GitRepoInfo, PackageResolverError>
parseVersionSpec(spec: string): Effect<PackageSpec, PackageResolverError>
```

**Types:**

```typescript
type GitRepoInfo = {
  url: string;
  name: string;
};

type PackageSpec = {
  repo: string;
  range: string;
};
```

**Libraries Used:**

- `npm-package-arg` - Parse package specifications
- `hosted-git-info` - Resolve to git URLs

**Error Type:**

```typescript
class PackageResolverError extends Data.TaggedError("PackageResolverError")<{
  readonly message: string
  readonly spec: string
}>
```

---

### PathService

NodeCG-specific path detection and utilities.

**Methods:**

```typescript
pathContainsNodeCG(path: string): Effect<boolean, never>
getNodeCGPath(): Effect<string, PathError>
isBundleFolder(path: string): Effect<boolean, never>
getCurrentNodeCGVersion(): Effect<string, PathError>
```

**Dependencies:** FileSystemService

**Error Type:**

```typescript
class PathError extends Data.TaggedError("PathError")<{
  readonly message: string
}>
```

---

### Semver (Pure Functions)

Pure utility functions wrapping semver library.

**Functions:**

```typescript
maxSatisfying(versions: ReadonlyArray<string>, range: string): string | undefined
coerce(version: string): SemVer | undefined
eq(v1: string, v2: string): boolean
lt(v1: string, v2: string): boolean
gte(v1: string, v2: string): boolean
```

**Note:** These are pure functions, NOT wrapped in Effect, since semver operations don't do I/O.

---

## 3. Project Structure

```
workspaces/cli/src/
├── services/
│   ├── file-system.ts          # FileSystemService
│   ├── terminal.ts             # TerminalService
│   ├── http.ts                 # HttpService
│   ├── command.ts              # CommandService
│   ├── git.ts                  # GitService
│   ├── npm.ts                  # NpmService
│   ├── json-schema.ts          # JsonSchemaService
│   ├── package-resolver.ts     # PackageResolverService
│   └── path.ts                 # PathService
├── lib/
│   ├── semver.ts               # Pure semver functions
│   └── bundle-utils.ts         # Bundle utilities using services
├── commands/
│   ├── setup.ts                # nodecg setup
│   ├── install.ts              # nodecg install
│   ├── start.ts                # nodecg start
│   ├── defaultconfig.ts        # nodecg defaultconfig
│   ├── uninstall.ts            # nodecg uninstall
│   └── schema-types.ts         # nodecg schema-types
├── index.ts                    # CLI app definition
└── bin/
    └── nodecg.ts               # Entry point with layer composition
```

---

## 4. Dependencies

### Add (Effect Ecosystem)

```json
{
  "dependencies": {
    "effect": "^3.11.0",
    "@effect/platform": "^0.73.0",
    "@effect/platform-node": "^0.67.0",
    "@effect/cli": "^0.51.0",
    "@effect/schema": "^0.79.0"
  }
}
```

### Keep (Wrapped in Effect Services)

```json
{
  "dependencies": {
    "ajv": "^8.17.1",
    "json-schema-to-typescript": "^15.0.3",
    "semver": "^7.6.3",
    "tar": "^7.4.3",
    "hosted-git-info": "^8.0.2",
    "npm-package-arg": "^12.0.1"
  }
}
```

### Remove (Replaced by Effect)

- ❌ `commander` → `@effect/cli`
- ❌ `chalk` → ANSI codes in TerminalService
- ❌ `nano-spawn` → CommandService using platform Command
- ❌ `@inquirer/prompts` → TerminalService confirm/readLine

---

## 5. Layer Architecture

```
Main Program
└── Provide: MainLayer
    ├── Provide: NodeContext.layer
    │   ├── NodeFileSystem.layer
    │   ├── NodeHttpClient.layerWithoutAgent
    │   └── NodeTerminal.layer
    └── Service Layers
        ├── FileSystemService.Default
        ├── TerminalService.Default
        ├── HttpService.Default
        ├── CommandService.Default
        ├── GitService.Default
        ├── NpmService.Default
        ├── JsonSchemaService.Default
        ├── PackageResolverService.Default
        └── PathService.Default
```

**Layer Dependencies:**

- Layer 1 (Platform): FileSystemService, TerminalService, HttpService, CommandService
- Layer 2 (Domain): GitService → CommandService
- Layer 2 (Domain): NpmService → HttpService, CommandService
- Layer 2 (Domain): JsonSchemaService → FileSystemService
- Layer 2 (Domain): PackageResolverService → (no Effect deps)
- Layer 2 (Domain): PathService → FileSystemService

---

## 6. Commands

All commands use `@effect/cli` Command builder with typed options and arguments.

### setup.ts

**Command:** `nodecg setup [version] [-u] [-k]`

**Options:**

- `version` (optional) - Semver range to install
- `-u, --update` - Update existing installation
- `-k, --skip-dependencies` - Skip npm install

**Flow:**

1. Check if NodeCG already installed (update mode)
2. List npm versions
3. Find target version with semver
4. Confirm if downgrade
5. Download tarball from npm
6. Extract tarball
7. Install dependencies

**Services Used:** FileSystemService, TerminalService, PathService, NpmService, HttpService

---

### install.ts

**Command:** `nodecg install [repo] [-d]`

**Options:**

- `repo` (optional) - Git repo (user/repo or URL with optional #version)
- `-d, --dev` - Install dev dependencies

**Flow:**

1. If no repo: install bundle deps in current directory
2. Parse repo spec (handle #version)
3. Resolve to git URL
4. Fetch git tags
5. Find target version
6. Clone repo
7. Checkout version
8. Install dependencies

**Services Used:** FileSystemService, TerminalService, PathService, GitService, PackageResolverService

---

### start.ts

**Command:** `nodecg start [-d]`

**Options:**

- `-d, --disable-source-maps` - Disable source map support

**Flow:**

1. Recursively find project directory
2. Check if NodeCG exists (legacy mode)
3. Check if NodeCG in node_modules (installed mode)
4. Dynamic import NodeCG entry point

**Services Used:** FileSystemService, PathService

---

### defaultconfig.ts

**Command:** `nodecg defaultconfig [bundle]`

**Options:**

- `bundle` (optional) - Bundle name (uses cwd if omitted)

**Flow:**

1. Determine bundle name
2. Verify bundle and schema exist
3. Read configschema.json
4. Apply defaults using ajv
5. Write config file

**Services Used:** FileSystemService, TerminalService, PathService, JsonSchemaService

---

### uninstall.ts

**Command:** `nodecg uninstall <bundle> [-f]`

**Options:**

- `bundle` (required) - Bundle name to uninstall
- `-f, --force` - Skip confirmation

**Flow:**

1. Verify bundle exists
2. Confirm deletion (unless force)
3. Delete bundle directory

**Services Used:** FileSystemService, TerminalService, PathService

---

### schema-types.ts

**Command:** `nodecg schema-types [dir] [-o <path>] [--no-config-schema]`

**Options:**

- `dir` (optional) - Schema directory (default: "schemas")
- `-o, --out-dir` - Output directory (default: "src/types/schemas")
- `--config-schema` - Include configschema.json (default: true)

**Flow:**

1. Verify input directory exists
2. Create output directory if needed
3. List all .json schema files
4. Compile each to TypeScript definitions
5. Write output files

**Services Used:** FileSystemService, TerminalService, JsonSchemaService

---

## 7. Error Handling Strategy

### Principles

1. **No throwing** - All errors in Effect type
2. **Tagged errors** - Use `Data.TaggedError` for all error types
3. **Structured errors** - Include relevant context (path, command, url, etc.)
4. **User-friendly messages** - Format at terminal boundary
5. **Type-safe propagation** - Errors flow through Effect type system

### Error Rendering

Commands handle errors at the boundary:

```typescript
program.pipe(
  Effect.catchTag("FileSystemError", (e) =>
    terminal.writeError(`File error: ${e.message}`),
  ),
  Effect.catchTag("GitError", (e) =>
    terminal.writeError(`Git error: ${e.message}`),
  ),
  // ... other error handlers
);
```

---

## 8. Code Style Rules

### Effect Patterns

- ✅ **Always** use `Effect.fn("name")(function* () {})`
- ❌ **Never** use `Effect.gen(function* () {})`
- ✅ Use `Effect.Service` for all service definitions
- ✅ Use `yield*` for Effect unwrapping
- ✅ Use `Effect.all` with `{ concurrency: "unbounded" }` for parallel operations

### Type Safety

- ❌ **No `any` types anywhere**
- ❌ **No type assertions** (`as`, `!`, etc.)
- ✅ Use `Schema.decodeUnknown` for runtime validation
- ✅ Use `ReadonlyArray` instead of `Array`
- ✅ Fully type all Effect types: `Effect<Output, Error, Requirements>`

### Imports

- ✅ **Only import from library roots**
  ```typescript
  import { Effect, Layer, Data } from "effect";
  import { FileSystem, Command, Terminal, HttpClient } from "@effect/platform";
  import { NodeFileSystem, NodeHttpClient } from "@effect/platform-node";
  ```
- ❌ **Never import from subpaths**
  ```typescript
  // WRONG:
  import { FileSystem } from "@effect/platform/FileSystem";
  ```

### Service Definition Pattern

```typescript
export class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.fn("MyService.make")(function* () {
    const dep = yield* SomeDependency;

    return {
      myMethod: (arg: string) =>
        Effect.fn("myMethod")(function* () {
          // implementation
        }),
    };
  }),
  dependencies: [SomeDependency.Default],
}) {}
```

---

## 9. Migration Steps

### Phase 1: Setup (Steps 1-2)

1. ✅ Update package.json - Add Effect dependencies
2. ✅ Update package.json - Remove old dependencies (commander, chalk, nano-spawn, @inquirer/prompts)

### Phase 2: Platform Services (Steps 3-6)

3. ✅ Create `services/file-system.ts` - FileSystemService
4. ✅ Create `services/terminal.ts` - TerminalService
5. ✅ Create `services/http.ts` - HttpService
6. ✅ Create `services/command.ts` - CommandService

### Phase 3: Domain Services (Steps 7-11)

7. ✅ Create `services/git.ts` - GitService
8. ✅ Create `services/npm.ts` - NpmService
9. ✅ Create `services/json-schema.ts` - JsonSchemaService
10. ✅ Create `services/package-resolver.ts` - PackageResolverService
11. ✅ Create `services/path.ts` - PathService

### Phase 4: Utilities (Steps 12-13)

12. ✅ Create `lib/semver.ts` - Pure semver functions
13. ✅ Create `lib/bundle-utils.ts` - Bundle utilities

### Phase 5: Commands (Steps 14-19)

14. ✅ Migrate `commands/start.ts` (simplest)
15. ✅ Migrate `commands/uninstall.ts`
16. ✅ Migrate `commands/defaultconfig.ts`
17. ✅ Migrate `commands/schema-types.ts`
18. ✅ Migrate `commands/setup.ts`
19. ✅ Migrate `commands/install.ts` (most complex)

### Phase 6: Integration (Steps 20-21)

20. ✅ Create `index.ts` - CLI app with all commands
21. ✅ Create `bin/nodecg.ts` - Entry point with layer composition

### Phase 7: Testing (Steps 22-24)

22. ✅ Create test layers for service mocking
23. ✅ Migrate all existing tests
24. ✅ Ensure all tests pass

### Phase 8: Cleanup (Steps 25-27)

25. ✅ Remove old implementation files
26. ✅ Final cleanup of package.json
27. ✅ Build and verify CLI works end-to-end

---

## 10. Testing Strategy

### Service Mocking

Create mock layers for testing:

```typescript
// test/layers/mock-file-system.ts
export const MockFileSystemLayer = Layer.succeed(FileSystemService, {
  readJson: () => Effect.succeed({}),
  writeJson: () => Effect.void,
  exists: () => Effect.succeed(false),
  // ... other methods
});
```

### Test Pattern

```typescript
import { Effect } from "effect";
import { describe, it, expect } from "vitest";
import { startCommand } from "../src/commands/start.js";

describe("start command", () => {
  it("should start NodeCG", async () => {
    const result = await Effect.fn("test")(function* () {
      return yield* startCommand({ disableSourceMaps: false });
    }).pipe(
      Effect.provide(MockFileSystemLayer),
      Effect.provide(MockPathServiceLayer),
      Effect.runPromise,
    );

    expect(result).toBeDefined();
  });
});
```

### Test Layers Needed

- MockFileSystemLayer
- MockTerminalLayer
- MockHttpLayer
- MockCommandLayer
- MockGitLayer
- MockNpmLayer
- MockJsonSchemaLayer
- MockPackageResolverLayer
- MockPathLayer

---

## 11. Success Criteria

### Functional Requirements

- ✅ All 6 commands work identically to current implementation
- ✅ All command options and arguments supported
- ✅ All error cases handled properly
- ✅ Output formatting matches current behavior

### Technical Requirements

- ✅ Zero `any` types
- ✅ Zero type assertions
- ✅ All services use `Effect.Service`
- ✅ All functions use `Effect.fn`
- ✅ All imports from library roots only
- ✅ Full test coverage with Effect patterns
- ✅ All tests pass

### Quality Requirements

- ✅ Clean separation of concerns
- ✅ Testable architecture with DI
- ✅ Type-safe error handling
- ✅ Documented service APIs
- ✅ Consistent code style

---

## 12. Risk Mitigation

### Known Challenges

1. **Stream handling** - Tarball extraction with Effect streams

   - **Mitigation**: Use `Readable.from()` to convert Effect Stream → Node stream for tar

2. **Dynamic imports** - Start command imports NodeCG dynamically

   - **Mitigation**: Wrap in `Effect.promise()`

3. **JSON Schema runtime** - Cannot convert JSON Schema → Effect Schema

   - **Mitigation**: Keep `ajv` and wrap in JsonSchemaService

4. **Process spawning** - Some commands need stdout streaming
   - **Mitigation**: CommandService provides both `exec` (silent) and `string` (capture) methods

### Rollback Plan

If migration blocked:

1. Keep current implementation in separate branch
2. Can revert to pre-migration state
3. Migration is isolated to `workspaces/cli` only

---

## 13. Timeline Estimate

**Total Estimated Time: 2-3 days of focused work**

- Phase 1 (Setup): 30 minutes
- Phase 2 (Platform Services): 3-4 hours
- Phase 3 (Domain Services): 4-5 hours
- Phase 4 (Utilities): 1 hour
- Phase 5 (Commands): 6-8 hours
- Phase 6 (Integration): 1 hour
- Phase 7 (Testing): 4-5 hours
- Phase 8 (Cleanup): 1 hour

---

## Appendix A: Import Reference

### Standard Imports

```typescript
// Effect core
import { Effect, Layer, Data, Context, pipe, Option } from "effect";

// Platform
import {
  FileSystem,
  Command as PlatformCommand,
  Terminal,
  HttpClient,
  HttpClientRequest,
  HttpClientError,
  HttpClientResponse,
} from "@effect/platform";

// Platform Node
import {
  NodeFileSystem,
  NodeHttpClient,
  NodeTerminal,
  NodeContext,
  NodeRuntime,
} from "@effect/platform-node";

// CLI
import { Command, Args, Options, CliApp } from "@effect/cli";

// Schema
import { Schema } from "@effect/schema";

// Node built-ins (use node: prefix)
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
```

---

## Appendix B: Service Template

```typescript
import { Effect, Data } from "effect";

export class MyServiceError extends Data.TaggedError("MyServiceError")<{
  readonly message: string;
  // ... other fields
}> {}

export class MyService extends Effect.Service<MyService>()("MyService", {
  effect: Effect.fn("MyService.make")(function* () {
    const dep1 = yield* Dependency1;
    const dep2 = yield* Dependency2;

    return {
      method1: (arg: string) =>
        Effect.fn("method1")(function* () {
          // Implementation
          return yield* someEffect;
        }),

      method2: (arg: number) =>
        Effect.fn("method2")(function* () {
          // Implementation
          return yield* anotherEffect;
        }),
    };
  }),
  dependencies: [Dependency1.Default, Dependency2.Default],
}) {}
```

---

## Appendix C: Command Template

```typescript
import { Effect } from "effect";
import { Command, Args, Options } from "@effect/cli";

export const myCommand = Command.make(
  "my-command",
  {
    requiredArg: Args.text({ name: "arg" }),
    optionalArg: Args.text({ name: "opt" }).pipe(Args.optional),
    flag: Options.boolean("flag").pipe(
      Options.withAlias("f"),
      Options.optional,
    ),
    textOption: Options.text("option").pipe(
      Options.withDefault("default-value"),
    ),
  },
  ({ requiredArg, optionalArg, flag, textOption }) =>
    Effect.fn("myCommand")(function* () {
      const service1 = yield* Service1;
      const service2 = yield* Service2;

      // Command implementation
      yield* service1.doSomething(requiredArg);

      if (flag) {
        yield* service2.doSomethingElse();
      }
    }),
);
```

---

**End of Migration Plan**
