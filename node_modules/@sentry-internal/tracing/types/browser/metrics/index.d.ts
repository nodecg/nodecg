import type { Transaction } from '@sentry/core';
/**
 * Start tracking web vitals
 *
 * @returns A function that forces web vitals collection
 */
export declare function startTrackingWebVitals(): () => void;
/**
 * Start tracking long tasks.
 */
export declare function startTrackingLongTasks(): void;
/**
 * Start tracking interaction events.
 */
export declare function startTrackingInteractions(): void;
/** Add performance related spans to a transaction */
export declare function addPerformanceEntries(transaction: Transaction): void;
/** Create measure related spans */
export declare function _addMeasureSpans(transaction: Transaction, entry: Record<string, any>, startTime: number, duration: number, timeOrigin: number): number;
export interface ResourceEntry extends Record<string, unknown> {
    initiatorType?: string;
    transferSize?: number;
    encodedBodySize?: number;
    decodedBodySize?: number;
    renderBlockingStatus?: string;
}
/** Create resource-related spans */
export declare function _addResourceSpans(transaction: Transaction, entry: ResourceEntry, resourceName: string, startTime: number, duration: number, timeOrigin: number): void;
//# sourceMappingURL=index.d.ts.map