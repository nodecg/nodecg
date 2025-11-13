# Effect-TS Migration Strategy for NodeCG

## The Question: Root-to-Leaf vs Leaf-to-Root?

When migrating an existing TypeScript codebase to Effect-TS, should we start from the root (entry points) and work down to leaf functions, or start from leaf functions and work up to the root?

## The Answer: Hybrid Approach

**Within each workspace package**: **Root-to-Leaf (Top-Down)**

- Start at the package's entry point
- Work down through its internal functions
- Single `Effect.run*` call at the package boundary
- This aligns with Effect's "single execution point" philosophy

**Across the NodeCG codebase**: **Leaf-to-Root (Bottom-Up)**

- Extract isolated subsystems first into workspace packages
- Each becomes a self-contained Effect-based package
- Gradually work toward more coupled/central systems
- Old code calls new Effect packages via `Effect.runPromise` at boundaries

## Why This Works

This hybrid strategy gives us the best of both worlds:

### Benefits Within Each Package (Top-Down)

- ✅ **Aligns with Effect architecture** - Single execution point at the edge
- ✅ **Full Effect benefits** - Interruption, resource management, and error tracking work throughout
- ✅ **No intermediate conversions** - No need for `runPromise` calls within package logic
- ✅ **Cleaner composition** - Effects compose naturally from leaf functions up to entry point

### Benefits Across Codebase (Bottom-Up)

- ✅ **Incremental adoption** - No "big bang" rewrite required
- ✅ **Independent packages** - Each extraction is self-contained and testable
- ✅ **Low risk** - Existing code continues working while new packages are developed
- ✅ **Learning curve** - Team learns Effect patterns gradually
- ✅ **Parallel work** - Multiple packages can be migrated simultaneously

## Effect Documentation Guidance

From the official Effect documentation on "Running Effects":

> "The recommended approach is to design your program with the majority of its logic as Effects. It's advisable to use the `run*` functions closer to the 'edge' of your program."

> "An application built around Effect will involve a **single call to the main effect**."

This confirms the top-down approach within each subsystem, with execution happening once at the boundary.

## Candidate Subsystems for Migration

Based on analysis of the NodeCG codebase, here are viable candidates for extraction into Effect-based workspace packages:

- **Config Loader** - `src/server/config/` → `@nodecg/config` - ⭐ Easy (~130 LOC)
- **Mounts** - `src/server/mounts.ts` → `@nodecg/mounts` - ⭐ Very Easy (~27 LOC)
- **Bundle Parser** - `src/server/bundle-parser/` → `@nodecg/bundle-parser` - ⭐⭐ Moderate (~780 LOC)
- **Sounds** - `src/server/sounds.ts` → `@nodecg/sounds` - ⭐⭐ Moderate (~168 LOC)
- **Assets** - `src/server/assets.ts` → `@nodecg/assets` - ⭐⭐⭐ Complex (~415 LOC)

## Key Principles

### 1. Each Package is Effect-Native Internally

- All internal logic written as Effect programs
- Use Effect.Schema, Effect.gen, etc. throughout
- No Promise/async-await within package boundaries

### 2. Execute at Package Boundaries

- Single `Effect.run*` call where package is consumed
- Old code uses `Effect.runPromise` to call new packages
- New packages can call each other via Effect composition

### 3. Maintain Backwards Compatibility

- Existing NodeCG code continues working
- New packages provide Effect-based APIs
- Gradual replacement of old implementations

### 4. Incremental Testing

- Each package independently testable
- Use Effect testing utilities
- Maintain or improve test coverage

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
  const myFunction = (arg: string) => Effect.gen(function* () {
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

- **Use @effect/vitest** - Tests for Effect-TS code should use `@effect/vitest` for proper Effect testing utilities
- **Comprehensive unit tests** - Write unit tests for each service and domain logic
- **E2E with DI** - E2E tests should utilize Effect-TS's dependency injection to properly test service interactions
- **Maintain coverage** - Aim to maintain or improve existing test coverage during migration

### Type Safety

- **Infer return types** - Do not annotate return types unless absolutely needed (e.g., recursive functions)
- **Never widen with return types** - Do not use return type annotations to widen or combine types; fix the implementation instead
- **No `any`** - Do not use `any` under any circumstances
- **No type assertions** - Do not use type assertions (e.g., `as Type`) under any circumstances

## Migration Log

All migration work must be documented in `docs/effect-migration/log.md`. This creates a historical record of our progress and serves as a reference for future migrations.

**What to log**:

- Date and subsystem being worked on
- Key architectural decisions and rationale
- Problems encountered and how they were solved
- Effect patterns established or discovered
- Lessons learned and gotchas
- Migration status (in progress, completed, blocked)

**Why we log**:

- **Historical context** - Understand why decisions were made months later
- **Pattern reference** - See how similar problems were solved before
- **Knowledge sharing** - Team members can learn from each other's experiences
- **Progress tracking** - Clear visibility into what's been migrated and what remains

See the [migration log](./log.md) for detailed entries.

## Trade-offs

### Top-Down Within Packages

**Pros**:

- Full Effect benefits (interruption, resource management)
- Cleaner architecture (single execution point)
- Better composition

**Cons**:

- Requires more upfront commitment per package
- Can't partially migrate a single package

### Bottom-Up Across Codebase

**Pros**:

- Gradual adoption across NodeCG
- Low risk, high reversibility
- Team learns incrementally

**Cons**:

- Requires `Effect.runPromise` at boundaries
- Temporary mixing of Effect and non-Effect code

## Interoperability Patterns

### Calling Effect Code from Regular TypeScript

```typescript
// In old NodeCG code
import { loadConfig } from "@nodecg/config";

// Effect code is called via runPromise
const config = await Effect.runPromise(loadConfig("/path/to/config"));
```

### Calling Regular TypeScript from Effect Code

```typescript
// Within Effect package
const legacyResult = yield * Effect.promise(() => legacyAsyncFunction());
```

## Database Adapter Note

The current SQLite database adapter is marked as "legacy" and uses deprecated TypeORM. However, we're **not prioritizing its migration at this stage**. It will be rewritten with Effect later when the time is right, showcasing:

- Effect.Schema for models
- Layer pattern for connection management
- Effect for async operations with proper error handling
- Resource safety for database connections

## Success Criteria

A successful migration will:

1. ✅ Maintain NodeCG's functionality throughout
2. ✅ Improve error handling and type safety
3. ✅ Create reusable, well-tested workspace packages
4. ✅ Establish clear patterns for future development
5. ✅ Enable incremental team learning of Effect-TS

## Resources

- [Effect Documentation](https://effect.website/docs/getting-started/introduction/)
- [Running Effects](https://effect.website/docs/getting-started/running-effects/)
- [Effect vs Promise](https://effect.website/docs/additional-resources/effect-vs-promise/)
- [Effect GitHub](https://github.com/Effect-TS/effect)
