export declare const COUNTER_METRIC_TYPE: "c";
export declare const GAUGE_METRIC_TYPE: "g";
export declare const SET_METRIC_TYPE: "s";
export declare const DISTRIBUTION_METRIC_TYPE: "d";
/**
 * Normalization regex for metric names and metric tag names.
 *
 * This enforces that names and tag keys only contain alphanumeric characters,
 * underscores, forward slashes, periods, and dashes.
 *
 * See: https://develop.sentry.dev/sdk/metrics/#normalization
 */
export declare const NAME_AND_TAG_KEY_NORMALIZATION_REGEX: RegExp;
/**
 * Normalization regex for metric tag values.
 *
 * This enforces that values only contain words, digits, or the following
 * special characters: _:/@.{}[\]$-
 *
 * See: https://develop.sentry.dev/sdk/metrics/#normalization
 */
export declare const TAG_VALUE_NORMALIZATION_REGEX: RegExp;
/**
 * This does not match spec in https://develop.sentry.dev/sdk/metrics
 * but was chosen to optimize for the most common case in browser environments.
 */
export declare const DEFAULT_BROWSER_FLUSH_INTERVAL = 5000;
/**
 * SDKs are required to bucket into 10 second intervals (rollup in seconds)
 * which is the current lower bound of metric accuracy.
 */
export declare const DEFAULT_FLUSH_INTERVAL = 10000;
/**
 * The maximum number of metrics that should be stored in memory.
 */
export declare const MAX_WEIGHT = 10000;
//# sourceMappingURL=constants.d.ts.map