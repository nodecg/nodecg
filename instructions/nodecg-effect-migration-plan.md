# NodeCG Effect Migration Plan

## Executive Summary

This document outlines a comprehensive plan for migrating NodeCG's server-side codebase from imperative TypeScript to functional programming with Effect. The migration leverages NodeCG's existing Effect dependency and the foundational work in `src/server/util-fp/` to transform the entire backend architecture into a type-safe, composable, and maintainable system.

## Quick Reference: Migration Order

1. **Timer Service** → 2. **Configuration** → 3. **Database Layer** → 4. **Bundle Parser** → 5. **Bundle Manager** → 6. **Extension System** → 7. **Replicant System** → 8. **API Layer** → 9. **Server Bootstrap**

Start with leaf functions and work outward to entry points. Address resource management issues first.

## Current State Assessment

### Codebase Overview

NodeCG is a broadcast graphics framework with the following architecture:

- **Monorepo Structure**: npm workspaces with separate packages
- **Core Initialization Flow**: `index.js` → `bootstrap.ts` → `NodeCGServer`
- **Core Systems**:
  - Bundle management (dynamic plugin loading with dependency resolution)
  - Replicant system (CRDT-like real-time data synchronization)
  - Extension system (isolated API instances per bundle)
  - Socket.IO integration for real-time communication
  - Express HTTP server with middleware

### Existing Effect Usage

- Effect is already a dependency in package.json
- Initial Effect utilities exist in `src/server/util-fp/`:
  - `readFileSync`, `existsSync`, `parseJson`, `readJsonFileSync`
- Empty directory structure at `src/server/effect/` ready for expansion

### Architecture Pain Points

1. **Complex Error Propagation**

   - Errors cross HTTP, WebSocket, file system, and extension boundaries
   - Custom error serialization for Socket.IO
   - Sentry integration but no unified error strategy
   - Bundle failures can cascade unexpectedly

2. **Resource Management Issues**

   - File watchers (chokidar) not always cleaned up
   - Manual timer tracking in `throttle-name.ts`
   - No systematic resource disposal on error paths
   - Memory leaks from event listeners

3. **Dependency & Initialization Complexity**

   - Strict initialization order: Config → Server → Bundle Manager → Extensions
   - Circular dependencies between API instances and extensions
   - Factory patterns and singletons make testing difficult
   - Extensions can have circular dependencies

4. **State Management Challenges**

   - Global mutable state (bundles array, timers map)
   - Replicator uses Proxy-based change detection with WeakMaps
   - Throttled persistence without backpressure
   - Race conditions in bundle loading

5. **Async Pattern Inconsistency**
   - Mix of callbacks, promises, and async/await
   - Event emitters for cross-component communication
   - Synchronous file operations block event loop
   - No proper concurrency control

## Migration Strategy

### Phase 1: Foundation and Infrastructure (Weeks 1-3)

#### 1.1 Core Effect Setup

**Directory Structure:**

```
src/server/effect/
├── services/
│   ├── ConfigService.ts
│   ├── BundleManager.ts
│   └── ReplicantService.ts
├── layers/
│   └── index.ts         # Layer composition
└── utils/
    ├── interop.ts       # Effect-Promise interop
    └── schema.ts        # Common schemas
```

**Error Definition Principle:**

```typescript
// Errors are defined in the modules where they originate
// This keeps error definitions close to their usage and makes
// the codebase more maintainable

// Example: ConfigService.ts
import { Data } from "effect";

export class ConfigurationError extends Data.TaggedError("ConfigurationError")<{
  readonly configPath: string;
  readonly reason: string;
}> {}

// Example: BundleManager.ts
export class BundleLoadError extends Data.TaggedError("BundleLoadError")<{
  readonly bundleName: string;
  readonly reason: string;
  readonly cause?: unknown;
}> {}

export class BundleValidationError extends Data.TaggedError(
  "BundleValidationError",
)<{
  readonly bundleName: string;
  readonly field: string;
  readonly message: string;
}> {}

// Only truly shared errors would go in a common module
// Most errors should be co-located with their service/feature
```

#### 1.2 Enhance Existing Utilities

Expand `src/server/util-fp/` with:

- Typed error handling for all operations
- Additional file system operations
- JSON schema validation with Effect Schema
- Path manipulation utilities

### Phase 2: Core Services & Resource Management (Weeks 4-8)

#### 2.1 Timer Management Service

**Target:** `src/server/lib/throttle-name.ts`

**Critical Need:**

- Currently uses global Maps for timer tracking
- No automatic cleanup on errors
- Memory leaks possible

**Implementation:**

- Create `TimerService` with Effect's resource management
- Use `Effect.acquireRelease` for timer lifecycle
- Implement debounce/throttle as Effect operators
- Track all timers in a Ref for graceful shutdown

#### 2.2 Configuration Service

**Target Files:**

- `src/server/config/loader.ts`
- `src/server/config/index.ts`

**Implementation Outline:**

- Define `ConfigurationError` in the same file
- Support multiple config file formats (JSON, YAML, JS)
- Validate against TypeScript types using Schema
- Handle file watching for config changes
- Provide config as a service through Context

#### 2.3 Database Adapter Layer

**Target:**

- `workspaces/database-adapter-sqlite-legacy/`
- `src/server/database/` interfaces

**Architecture:**

- Create abstract `DatabaseAdapter` service interface
- Implement SQLite adapter with proper connection pooling
- Add transaction support with Effect's STM
- Handle replicant persistence with backpressure control
- Implement automatic retry with configurable policies

### Phase 3: Bundle System Migration (Weeks 9-14)

#### 3.1 Bundle Parser with Dependency Resolution

**Target Files:**

- `src/server/bundle-parser/` - All parser modules
- Bundle dependency resolution logic

**Critical Improvements:**

- Replace synchronous file operations with Effect
- Implement topological sort for dependency order
- Validate NodeCG version compatibility
- Handle circular dependency detection
- Create structured errors for each failure mode

#### 3.2 Bundle Manager Refactoring

**Target:** `src/server/bundle-manager.ts` (extends TypedEmitter)

**Major Changes:**

- Replace EventEmitter with Effect Streams
- Convert chokidar file watching to Effect resources
- Implement proper debouncing with TimerService
- Create state machine for bundle lifecycle
- Add Effect-based hot reload with proper cleanup

**Resource Management:**

- Track file watchers per bundle
- Ensure cleanup on bundle removal
- Handle watch errors gracefully
- Implement backpressure for file change events

#### 3.3 Extension System Integration

**Target:** Extension loading and lifecycle

**Architecture:**

- Create `ExtensionService` for managing extension instances
- Replace synchronous require() with Effect-based loading
- Implement extension isolation boundaries
- Add proper error recovery per extension
- Support hot reloading of extensions

### Phase 4: Replicant System Overhaul (Weeks 15-20)

#### 4.1 Replicator Core Migration

**Target:** `src/server/replicant/` (Proxy-based change detection)

**Major Improvements:**

- Replace Proxy-based change detection with Effect STM
- Implement CRDT-like operations with Effect
- Convert WeakMap tracking to Effect Ref
- Add proper backpressure for persistence
- Create structured operation log with Effect Streams

**Concurrency Control:**

- Use STM for conflict-free updates
- Implement read/write locks for replicants
- Handle concurrent modifications safely
- Add operation ordering guarantees

#### 4.2 Replicant Persistence Layer

**Critical Issues to Address:**

- Throttled saves can lose data on crash
- No transaction support
- Race conditions in save queue

**Implementation:**

- Create transaction log with Effect Persistence
- Implement write-ahead logging
- Add configurable persistence strategies
- Handle database errors with retry policies

#### 4.3 Socket.IO Integration

**Target:** Real-time replicant synchronization

**Architecture:**

- Create Effect Stream adapters for Socket.IO
- Implement proper error boundaries per client
- Add client-specific error handling
- Support acknowledgment wrapping
- Handle connection lifecycle with Effect resources

### Phase 5: Server Integration & API Layer (Weeks 21-26)

#### 5.1 API Server Migration

**Target:** `src/server/api.server.ts` (Factory pattern)

**Challenges:**

- Each bundle gets its own API instance
- Cross-bundle communication through `nodecg.extensions`
- Static methods for context-agnostic operations

**Implementation:**

- Create `APIFactory` service with Effect
- Implement bundle isolation with Effect Context
- Replace static methods with service operations
- Add type-safe inter-bundle messaging
- Handle extension access through Effect services

#### 5.2 NodeCGServer & Bootstrap

**Target:** `src/server/bootstrap.ts` & `src/server/server/index.ts`

**Critical Path:**

1. Config → Server setup → Socket.IO → Bundle discovery → Extension loading
2. Must maintain exact initialization order
3. Handle graceful shutdown with exit hooks

**Architecture:**

- Create Effect program for server lifecycle
- Build Layer dependency graph matching init order
- Implement graceful shutdown with finalizers
- Add health checks and readiness probes
- Support zero-downtime restarts

#### 5.3 Middleware & HTTP Layer

**Integration Points:**

- Express middleware stack
- Static file serving for bundles
- Authentication/authorization
- CORS and security headers

**Implementation:**

- Create Effect middleware adapters
- Implement request context propagation
- Add structured logging with Effect
- Handle multipart uploads with streaming

## Critical Architecture Challenges & Solutions

### 1. Circular Dependencies

**Problem:**

- API instances need access to all extensions
- Extensions access each other through `nodecg.extensions`
- Circular imports between modules

**Effect Solution:**

- Use lazy evaluation with Effect Context
- Implement service locator pattern with Effect Layer
- Break cycles with async boundaries

### 2. Global State Management

**Problem:**

- Global bundles array mutated from multiple places
- Timer maps without proper cleanup
- Shared state without synchronization

**Effect Solution:**

- Replace with Effect Ref for safe concurrent access
- Use STM for complex state coordination
- Implement state machines with Effect

### 3. Event Emitter Overuse

**Problem:**

- TypedEmitter used everywhere for loose coupling
- Hard to trace event flow
- Memory leaks from unregistered listeners

**Effect Solution:**

- Replace with Effect Streams
- Explicit data flow with Effect pipelines
- Automatic cleanup with resource management

### 4. Extension Isolation

**Problem:**

- Extensions run in same process
- One extension crash affects others
- No resource limits per extension

**Effect Solution:**

- Error boundaries with Effect
- Resource quotas per extension
- Isolated failure domains

## Implementation Guidelines

### 1. Error Design Principles

- **Co-location**: Define errors in the module where they originate, not in a central errors file
- **Specific over Generic**: Create distinct error types for each failure mode
- **Include Context**: Add debugging information (paths, IDs, timestamps)
- **Composable**: Errors should be transformable and combinable
- **User-Friendly**: Map technical errors to user-understandable messages

**When to Share Errors:**

```typescript
// Shared errors are rare - only when truly used across multiple unrelated modules
// Example: Authentication errors might be shared if used by multiple services

// src/server/effect/auth/errors.ts
export class UnauthorizedError extends Data.TaggedError("UnauthorizedError")<{
  readonly userId?: string;
  readonly reason: string;
}> {}

// But most errors should stay with their service:
// - BundleLoadError stays in BundleManager.ts
// - ConfigurationError stays in ConfigService.ts
// - ReplicantNotFoundError stays in ReplicantService.ts
```

### 2. Service Design Patterns

**Core Principles:**

- Services as interfaces with `Context.Tag`
- Errors defined in the same module as the service
- Layers compose service implementations with dependencies
- Use `Effect.gen` for service construction
- Explicit dependency declaration in type signatures

### 3. Migration Patterns

#### Key Migration Patterns

**Async to Effect:**

- Wrap Promise-based functions with `Effect.tryPromise`
- Use `Effect.gen` for sequential operations
- Define specific error types for each failure mode

**Resource Management:**

- Use `Effect.scoped` for automatic resource cleanup
- Leverage `Effect.acquireUseRelease` for custom resources
- Platform services handle their own resource management

**Error Transformation:**

- Use `catchTags` to handle specific error types
- Map platform errors to domain errors at service boundaries
- Preserve error context for debugging

### 4. Testing Strategy

**Unit Testing Approach:**

- Mock services using `Layer.succeed` with test implementations
- Use `@effect/platform` test utilities for mocking FileSystem
- Test both success and failure paths with typed errors
- Compose test layers for integration scenarios
- Use `@effect/vitest` for Effect-based test utilities

**Test Organization:**

- Co-locate test files with implementation
- Create test-specific service implementations
- Use Effect's built-in test utilities and `@effect/vitest` package
- Ensure deterministic test execution with TestClock manipulation

**@effect/vitest Integration:**

- Install `@effect/vitest` for enhanced Effect testing capabilities
- Use `it.effect()` for running Effect-based tests with TestContext
- Leverage `it.scoped` for resource management in tests
- Use `it.flakyTest` for handling non-deterministic test scenarios
- Access TestClock service for time-based testing
- Handle both success and failure cases with `Effect.exit`

```typescript
// Example Effect test pattern
import { it, expect } from "@effect/vitest"
import { Effect, TestClock } from "effect"
import { MyService, ServiceError } from "../MyService"

it.effect("should handle service operation successfully", () =>
  Effect.gen(function* () {
    const result = yield* MyService.performOperation("test-input")
    expect(result).toBe("expected-output")
  })
)

it.effect("should handle time-based operations", () =>
  Effect.gen(function* () {
    const testClock = yield* TestClock.TestClock
    const promise = Effect.runPromise(
      Effect.gen(function* () {
        yield* Effect.sleep("1 second")
        return "completed"
      })
    )
    yield* testClock.adjust("1 second")
    const result = yield* Effect.promise(() => promise)
    expect(result).toBe("completed")
  })
)
```

## Backward Compatibility Strategy

### API Compatibility

**Dual API Pattern:**

```typescript
// Provide both Effect and Promise APIs during migration
export const loadBundle = dual(
  (name: string) => Effect.Effect<Bundle, BundleError>,
  async (name: string) => Effect.runPromise(loadBundle(name)),
);
```

### Extension Compatibility

**Requirements:**

- Existing extensions must work without modification
- Maintain `nodecg` API object interface
- Support both callback and promise patterns
- Preserve event emitter interface for compatibility

**Implementation:**

- Create adapter layer for legacy extensions
- Wrap Effect services in compatible API
- Gradually migrate extensions to Effect
- Provide migration guide for extension authors

### Socket.IO Protocol

**Maintain wire format:**

- Keep existing message structure
- Support legacy acknowledgment callbacks
- Preserve error serialization format
- Add Effect-based handlers alongside legacy

## Migration Checklist

### Per-Module Checklist

- [ ] Identify all I/O operations and side effects
- [ ] Define specific error types for failure modes
- [ ] Create service interface with Effect types
- [ ] Implement service with proper error handling
- [ ] Create Layer for dependency injection
- [ ] Update consumers to use Effect.runPromise
- [ ] Write tests with mock services
- [ ] Document new patterns and usage

### Global Checklist

- [ ] Effect error type hierarchy established
- [ ] Core services implemented (Config, FileSystem, Database)
- [ ] Interop utilities for gradual migration
- [ ] Testing infrastructure ready
- [ ] Documentation updated
- [ ] Team trained on Effect patterns
- [ ] Performance benchmarks show no regression

## Success Metrics

1. **Code Quality**

   - 100% of server-side errors are typed
   - No `any` types in Effect chains
   - All I/O operations use Effect

2. **Testing**

   - Increased test coverage (target: >80%)
   - Faster test execution with mock services
   - Reduced test flakiness

3. **Runtime Behavior**

   - Reduced uncaught exceptions
   - Better error messages for users
   - Improved debugging with error context

4. **Developer Experience**
   - Faster feature development
   - Easier onboarding for new developers
   - IDE autocomplete for all operations

## Risk Mitigation

1. **Performance Concerns**

   - Benchmark critical paths before/after migration
   - Use Effect's lazy evaluation effectively
   - Profile memory usage

2. **Team Adoption**

   - Provide Effect training sessions
   - Create internal documentation with examples
   - Pair programming during initial migrations

3. **Integration Issues**
   - Maintain compatibility layer during transition
   - Test thoroughly at each phase
   - Have rollback plan for each component

## Next Steps

1. **Week 1**: Set up Effect infrastructure and error types
2. **Week 2**: Migrate configuration loading as proof of concept
3. **Week 3**: Begin core services implementation
4. **Ongoing**: Regular team reviews and pattern refinement

## Resources

- Effect documentation: https://effect.website/llms.txt
- NodeCG Effect utilities: `src/server/util-fp/`
- Migration guide: `instructions/effect-migration.md`

This plan provides a structured, low-risk approach to transforming NodeCG's backend into a robust Effect-based architecture while maintaining system stability throughout the migration process.
