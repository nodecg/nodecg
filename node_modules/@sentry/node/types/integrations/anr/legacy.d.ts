interface LegacyOptions {
    entryScript: string;
    pollInterval: number;
    anrThreshold: number;
    captureStackTrace: boolean;
    debug: boolean;
}
/**
 * @deprecated Use the `Anr` integration instead.
 *
 * ```ts
 * import * as Sentry from '@sentry/node';
 *
 * Sentry.init({
 *   dsn: '__DSN__',
 *   integrations: [new Sentry.Integrations.Anr({ captureStackTrace: true })],
 * });
 * ```
 */
export declare function enableAnrDetection(options: Partial<LegacyOptions>): Promise<void>;
export {};
//# sourceMappingURL=legacy.d.ts.map