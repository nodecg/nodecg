# Effect-TS Migration Log

This log documents our journey migrating NodeCG to Effect-TS. Each entry captures decisions, challenges, and learnings from migrating specific subsystems.

## How to Use This Log

When working on a migration:

1. Create a new entry with the date and subsystem name
2. Document key decisions as you make them
3. Record problems and solutions when they arise
4. Update the status as work progresses
5. Add lessons learned when completing the migration

---

## Template

```markdown
### [YYYY-MM-DD] Subsystem Name

**Status**: In Progress | Completed | Blocked

**Overview**: Brief description of what this subsystem does and why we're migrating it.

**Key Decisions**:

- Decision 1 and rationale
- Decision 2 and rationale

**Problems & Solutions**:

- Problem: Description of issue encountered
  - Solution: How it was resolved

**Effect Patterns Used**:

- Pattern 1 (e.g., Effect.Schema for validation)
- Pattern 2 (e.g., Layer pattern for dependency injection)

**Lessons Learned**:

- Insight 1
- Insight 2

**Next Steps** (if in progress):

- [ ] Task 1
- [ ] Task 2
```

---

## Migration Entries

<!-- Add new entries below in reverse chronological order (newest first) -->

### [2025-11-13] @nodecg/internal-util

**Status**: Completed

**Overview**: Migrated the `@nodecg/internal-util` package to Effect-TS. This package provides core utilities for finding the Node.js project directory, detecting legacy vs installed mode, and computing root paths. It's a foundational dependency used by 15+ files across the codebase.

**Key Decisions**:

- **Dual API approach**: Maintained backward compatibility by exporting old synchronous API from `@nodecg/internal-util/sync` while providing new Effect-based API from main export
- **Function-based over service-based**: Used `Effect.fn()` for all Effect-returning functions rather than creating a service, keeping the API simple and functional
- **Loop over recursion**: Refactored recursive `findNodeJsProject` to use a `while` loop to avoid needing explicit return type annotations (Effect convention: infer types, avoid annotations)
- **@effect/vitest with vitest 3**: Downgraded from vitest 4 to vitest 3.2.4 to ensure @effect/vitest compatibility (peer dependency requires vitest ^3.2.0)
- **it.effect() pattern**: Used `Effect.fn(function* () { ... }, Effect.provide(TestLayer))` with `it.effect()` for cleaner test code without manual `.runPromise` calls

**Problems & Solutions**:

- Problem: Effect.fn() syntax was unclear from documentation

  - Solution: Consulted `docs/effect-migration/strategy.md` which had clear examples: `Effect.fn("name")(function* (arg) { ... })`

- Problem: Recursive function caused type inference issues

  - Solution: Refactored to iterative while loop, eliminating need for explicit return types

- Problem: Test assertions on Error union types failed type narrowing

  - Solution: Added `if (result._tag === "ErrorType")` guards to narrow union types before accessing error-specific properties

- Problem: tsdown's `exports: true` validation complained about missing root export

  - Solution: Renamed `main.ts` to `index.ts` so tsdown would auto-generate `.` export matching package.json

- Problem: @effect/vitest incompatible with vitest 4 (peer dependency requires vitest ^3.2.0)
  - Solution: Downgraded entire monorepo to vitest 3.2.4, ensuring @effect/vitest works properly without workarounds

**Effect Patterns Used**:

- **Effect.fn()** for all Effect-returning functions with descriptive names
- **Effect.gen** with generator functions for sequential Effect composition
- **Data.TaggedError** for custom error types (ProjectNotFoundError, PackageJsonParseError)
- **Effect.try** for wrapping potentially-throwing operations (JSON.parse)
- **Effect.flip** in tests to test error cases
- **FileSystem.FileSystem** and **Path.Path** services from @effect/platform
- **NodeContext.layer** and **NodeFileSystem.layer** for providing platform implementations in tests
- **Effect.Schema** for validating package.json structure
- **Effect.log** for logging instead of console.warn

**Test Coverage**:

Added comprehensive test suite (12 tests total):

- `find-project.test.ts`: Finding package.json in current/parent directories, error handling
- `project-type-effect.test.ts`: Legacy vs installed mode detection, JSON parsing errors
- `root-paths-effect.test.ts`: Path computation for both modes, NODECG_ROOT env var override

**Migration Impact**:

- **Files created**: 4 new Effect modules (find-project.ts, project-type-effect.ts, root-paths-effect.ts, index.ts), 3 test files, sync.ts compatibility layer
- **Files updated**: 15 import sites changed from `"@nodecg/internal-util"` to `"@nodecg/internal-util/sync"`
- **Lines migrated**: ~60 LOC of implementation, ~250 LOC of tests added
- **Breaking changes**: None (backward compatibility maintained via `/sync` export)

**Lessons Learned**:

- **YAGNI with Effect.fn**: Don't overthink the API - Effect.fn() with plain functions is sufficient, no need for services or complex patterns
- **Loops > recursion**: When using Effect, prefer loops over recursion to avoid return type annotation requirements
- **@effect/vitest works best with vitest 3**: Always use @effect/vitest for Effect tests, but check peer dependencies - vitest 4 incompatibility required downgrading to vitest 3.2.4
- **it.effect() with Effect.fn pattern**: `Effect.fn(function* () { ... }, Effect.provide(TestLayer))` provides clean tests without manual `.runPromise` calls while maintaining IDE test runner compatibility
- **Package.json exports are finicky**: When adding subpath exports, ensure the root `.` export exists and tsdown's entry filename matches conventions
- **Type narrowing with tagged unions**: Always use `_tag` checks before accessing error-specific properties in union types
- **Migration velocity**: Small, focused packages like this (~4 files) can be fully migrated with tests in a single session

**Performance Considerations**:

The old implementation had module-level side effects (file system reads at import time). The new Effect-based API is lazy by default, which is more correct but could be slower if called frequently. Consider using `Effect.cached()` if performance becomes an issue, though current usage patterns (mostly one-time initialization) likely don't require it.

**Next Steps**:

- Monitor usage of `/sync` imports and gradually migrate call sites to use the Effect API directly
- Consider adding `Effect.cached()` wrapper if profiling shows repeated path lookups are a bottleneck
- Document the new Effect API in user-facing documentation when Effect migration is more widespread
