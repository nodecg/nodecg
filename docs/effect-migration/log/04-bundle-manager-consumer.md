# Phase 4: Bundle Manager Consumer

**Status**: ✅ Complete
**Complexity**: ⭐⭐ Moderate

## Overview

Converted bundle-consuming route handlers to `Effect.fn` wrappers while keeping the legacy `BundleManager` class unchanged. This prepares consumers for the Phase 5 service swap without a big-bang change.

## Goals

- Wrap bundle consumers with `Effect.fn`
- Add stream-based event handling where needed (`listenToEvent`)
- Keep legacy `BundleManager` API unchanged
- Avoid regressions to hot-reload behavior

## Implementation

### Consumer Files Migrated

| File                 | Pattern     | Event Handling                                           |
| -------------------- | ----------- | -------------------------------------------------------- |
| `dashboard/index.ts` | `Effect.fn` | `listenToEvent("bundleChanged")` - clears cached context |
| `graphics/index.ts`  | `Effect.fn` | None - stateless lookups                                 |
| `sentry-config.ts`   | `Effect.fn` | `waitForEvent("ready")` + `listenToEvent("gitChanged")`  |
| `assets.ts`          | `Effect.fn` | Uses Phase 3 chokidar wrapper directly                   |
| `sounds.ts`          | `Effect.fn` | None - setup only                                        |
| `mounts.ts`          | `Effect.fn` | None - setup only                                        |
| `shared-sources.ts`  | `Effect.fn` | None - setup only                                        |

### Pattern Used

All consumers:

1. Accept `BundleManager` as parameter
2. Call `.all()` or `.find()` synchronously
3. Return Express router

Event-driven consumers fork scoped listeners:

```typescript
const stream = yield* listenToEvent<[]>(bundleManager, "bundleChanged");
yield* Effect.forkScoped(
  stream.pipe(Stream.runForEach(() => Effect.sync(() => { ... })))
);
```

## Decisions

1. **Keep BundleManager as-is** - Defer service rewrite to Phase 5
2. **Use `listenToEvent` for events** - Stream-based, auto-cleanup with scope
3. **No adapter layer** - Call legacy class directly to minimize surface area

## Legacy Gaps (for Phase 5)

- **Git parsing**: `parseBundleGit` mutates `process.cwd()` via git-rev-sync
- **Global state**: Module-level `bundles`, `hasChanged`, `backoffTimer`
- **Timing**: Ready delay (1000ms), change delay (100ms), backoff (500ms), git debounce (250ms)

## Files Modified

- `workspaces/nodecg/src/server/dashboard/index.ts`
- `workspaces/nodecg/src/server/graphics/index.ts`
- `workspaces/nodecg/src/server/assets.ts`
- `workspaces/nodecg/src/server/sounds.ts`
- `workspaces/nodecg/src/server/mounts.ts`
- `workspaces/nodecg/src/server/shared-sources.ts`
- `workspaces/nodecg/src/server/util/sentry-config.ts`
