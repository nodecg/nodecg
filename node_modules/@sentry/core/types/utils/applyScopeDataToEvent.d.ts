import type { Event, ScopeData } from '@sentry/types';
/**
 * Applies data from the scope to the event and runs all event processors on it.
 */
export declare function applyScopeDataToEvent(event: Event, data: ScopeData): void;
/** Merge data of two scopes together. */
export declare function mergeScopeData(data: ScopeData, mergeData: ScopeData): void;
/**
 * Merge properties, overwriting existing keys.
 * Exported only for tests.
 */
export declare function mergePropOverwrite<Prop extends 'extra' | 'tags' | 'user' | 'contexts' | 'sdkProcessingMetadata', Data extends ScopeData | Event>(data: Data, prop: Prop, mergeVal: Data[Prop]): void;
/**
 * Merge properties, keeping existing keys.
 * Exported only for tests.
 */
export declare function mergePropKeep<Prop extends 'extra' | 'tags' | 'user' | 'contexts' | 'sdkProcessingMetadata', Data extends ScopeData | Event>(data: Data, prop: Prop, mergeVal: Data[Prop]): void;
/** Exported only for tests */
export declare function mergeArray<Prop extends 'breadcrumbs' | 'fingerprint'>(event: Event, prop: Prop, mergeVal: ScopeData[Prop]): void;
//# sourceMappingURL=applyScopeDataToEvent.d.ts.map