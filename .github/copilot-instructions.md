# NodeCG Overview

NodeCG is a broadcast graphics framework that enables creation of dynamic web-based broadcast graphics. Graphics are rendered in web browsers and can be used with streaming software like OBS Studio, vMix, XSplit, and CasparCG.

# Development Commands

## Building & Development

- `npm run build` - Full production build (cleans dist/out, builds TypeScript, client, and workspaces)
- `npm start` - Start NodeCG server (requires build first)

## Testing & Quality

- `npm test` - Run Vitest test suite
- `npm run lint` - Run all linters (Prettier + ESLint)
- `npm run fix` - Auto-fix linting issues
- `npm run typetest` - Run TypeScript compilation tests in typetest/fake-bundle

# Architecture Overview

## Directory Structure

- `src/` - Main source code
  - `client/` - Browser-side code (dashboard, graphics)
  - `server/` - Node.js server code
  - `shared/` - Code shared between client and server
  - `types/` - TypeScript type definitions
- `workspaces/` - Monorepo workspaces
  - `cli/` - NodeCG CLI tool
  - `database-adapter-*` - Database adapters
  - `internal-util/` - Shared utilities
- `bundles/` - NodeCG bundles (plugins/extensions)
- `out/` - Compiled server code
- `dist/` - Compiled client assets

## Key Concepts

- **Bundles** - Plugin system for NodeCG. Each bundle can have extensions (server-side), dashboard panels, graphics, assets, and sounds
- **Extensions** - Server-side JavaScript code that runs in Node.js (located in bundle's `extension/` directory)
- **Graphics** - Client-side web pages displayed in streaming software (HTML/CSS/JS)
- **Dashboard** - Web-based control interface with panels for managing graphics
- **Replicants** - Real-time synchronized data between server and all clients
- **Workspaces** - Organizational structure for dashboard panels

## Bundle Structure

Bundles are defined in `package.json` with a `nodecg` field containing:

- `dashboardPanels[]` - Dashboard control panels
- `graphics[]` - Graphics pages with width/height
- `assetCategories[]` - File upload categories
- `soundCues[]` - Audio cue definitions
- `mount[]` - Custom HTTP endpoints

## Build System

- TypeScript compilation using `tsc` with project references
- Client bundling with esbuild (`scripts/build-client.ts`)
- Monorepo managed with npm workspaces
- Template files (`.tmpl`) copied during build

## Database & Configuration

- SQLite database adapter (`workspaces/database-adapter-sqlite-legacy`)
- Configuration loaded from `cfg/` directory (JSON, YAML, or JS)
- Config schema defined in `src/types/nodecg-config-schema.ts`

## Testing

- Vitest for unit/integration tests
- Test files use `.test.ts` extension
- Test fixtures in `test/fixtures/`
- TypeScript compilation tests in `typetest/`

# Important File Locations

## Server Entry Points

- `index.js` - Main server entry point
- `src/server/bootstrap.ts` - Server initialization
- `src/server/api.server.ts` - Server API implementation

## Client Entry Points

- `src/client/bundles/api.ts` - Client API
- `src/client/dashboard/` - Dashboard components
- `src/client/instance/` - Graphics instance management

## Bundle Management

- `src/server/bundle-manager.ts` - Bundle loading and management
- `src/server/bundle-parser/` - Bundle manifest parsing and validation

## Core Systems

- `src/server/replicant/` - Replicant synchronization system
- `src/server/server/extensions.ts` - Extension loading
- `src/shared/api.base.ts` - Shared API base classes

# Development Notes

## TypeScript Configuration

- Strict TypeScript settings enabled
- Project references for modular compilation
- Separate tsconfig.json files for client, server, and shared code

## Code Style

- ESLint with TypeScript rules
- Prettier for formatting
- Simple import sorting plugin
- **File naming**: Use kebab-case for all new files (e.g., `timer-service.ts`, not `TimerService.ts`)

## Testing Considerations

- Tests run in single worker mode (`maxWorkers: 1`)
- Special test environment variables (`NODECG_TEST=true`)
- Server tests require careful cleanup due to shared state
- **IMPORTANT**: Always check TypeScript diagnostics using `mcp__typescript-language-server__diagnostics` tool before running test files to catch TypeScript errors early

# Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) specification:

## Format

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

## Types

- `feat:` - New feature (correlates with MINOR in Semantic Versioning)
- `fix:` - Bug fix (correlates with PATCH in Semantic Versioning)
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring without feature changes or bug fixes
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `build:` - Build system or dependency changes
- `ci:` - CI configuration changes
- `chore:` - Other changes that don't modify src or test files

## Breaking Changes

- Add `!` after type/scope: `feat(api)!: remove deprecated methods`
- Or use `BREAKING CHANGE:` footer

## Examples

```
feat(dashboard): add panel workspace management
fix(replicant): resolve memory leak in subscription cleanup
docs: update bundle development guide
chore: update dependencies
```

# Effect Library Usage

Effect is a functional programming library that provides type-safe error handling, dependency injection, and resource management for TypeScript applications.

## Core Concepts

### Effect Type

The Effect type `Effect<A, E, R>` represents a computation that:

- **A**: Success value type (what it produces when successful)
- **E**: Error type (what errors can occur)
- **R**: Requirements (what dependencies it needs)

### Basic Operations

- `Effect.succeed(value)` - Create a successful Effect
- `Effect.fail(error)` - Create a failed Effect
- `Effect.try(() => code)` - Wrap synchronous code that might throw
- `Effect.tryPromise(() => promise)` - Wrap async code that might reject
- `Effect.gen(function* () { ... })` - Sequential composition with generators

### Error Handling

- Errors are explicit in the type system
- Use discriminated unions for specific error types
- Transform errors with `Effect.mapError` and `Effect.catchAll`
- Errors propagate automatically through Effect chains

### Service Pattern

- Define interfaces for capabilities, not implementations
- Use `Context.GenericTag` to create service identifiers
- Implement services with "Live" suffix for production
- Compose services using Layer system

### Layer System

- Layers provide dependency injection for services
- Build dependency graphs declaratively
- Automatic resource management and cleanup
- Compile-time verification of dependencies

### Composition

- Use `Effect.map` to transform success values
- Use `Effect.flatMap` to chain dependent operations
- Use `pipe` for readable data flow
- Compose small, focused functions into larger programs

## Best Practices

### Function Design

- Make side effects explicit through Effect types
- Keep pure functions pure (don't wrap in Effect unnecessarily)
- Define specific error types instead of using generic errors
- Make dependencies explicit in function signatures

### Error Modeling

- Create tagged error types using Schema.TaggedError
- Include relevant context in error types
- Use discriminated unions for exhaustive error handling
- Transform errors at appropriate boundaries
- Use dedicated type checking functions, not `_tag` property directly

### Testing

- Use Effect test utilities for deterministic testing
- Mock services by providing test implementations
- Test both success and error paths
- Use scoped effects for resource cleanup in tests

## Migration Approach

### Gradual Migration

- Start with leaf functions (no internal dependencies)
- Use interoperability bridges during transition
- Migrate from inside-out (utilities first, then consumers)
- Convert entire call chains before removing bridges

### Interoperability

- Use `Effect.runPromise` to execute Effects in Promise-based code
- Use `Effect.runSync` for synchronous execution
- Create adapter functions during migration period
- Avoid mixing Effect and Promise arbitrarily within modules
