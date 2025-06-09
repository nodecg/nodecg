Object.defineProperty(exports, '__esModule', { value: true });

const COUNTER_METRIC_TYPE = 'c' ;
const GAUGE_METRIC_TYPE = 'g' ;
const SET_METRIC_TYPE = 's' ;
const DISTRIBUTION_METRIC_TYPE = 'd' ;

/**
 * Normalization regex for metric names and metric tag names.
 *
 * This enforces that names and tag keys only contain alphanumeric characters,
 * underscores, forward slashes, periods, and dashes.
 *
 * See: https://develop.sentry.dev/sdk/metrics/#normalization
 */
const NAME_AND_TAG_KEY_NORMALIZATION_REGEX = /[^a-zA-Z0-9_/.-]+/g;

/**
 * Normalization regex for metric tag values.
 *
 * This enforces that values only contain words, digits, or the following
 * special characters: _:/@.{}[\]$-
 *
 * See: https://develop.sentry.dev/sdk/metrics/#normalization
 */
const TAG_VALUE_NORMALIZATION_REGEX = /[^\w\d_:/@.{}[\]$-]+/g;

/**
 * This does not match spec in https://develop.sentry.dev/sdk/metrics
 * but was chosen to optimize for the most common case in browser environments.
 */
const DEFAULT_BROWSER_FLUSH_INTERVAL = 5000;

/**
 * SDKs are required to bucket into 10 second intervals (rollup in seconds)
 * which is the current lower bound of metric accuracy.
 */
const DEFAULT_FLUSH_INTERVAL = 10000;

/**
 * The maximum number of metrics that should be stored in memory.
 */
const MAX_WEIGHT = 10000;

exports.COUNTER_METRIC_TYPE = COUNTER_METRIC_TYPE;
exports.DEFAULT_BROWSER_FLUSH_INTERVAL = DEFAULT_BROWSER_FLUSH_INTERVAL;
exports.DEFAULT_FLUSH_INTERVAL = DEFAULT_FLUSH_INTERVAL;
exports.DISTRIBUTION_METRIC_TYPE = DISTRIBUTION_METRIC_TYPE;
exports.GAUGE_METRIC_TYPE = GAUGE_METRIC_TYPE;
exports.MAX_WEIGHT = MAX_WEIGHT;
exports.NAME_AND_TAG_KEY_NORMALIZATION_REGEX = NAME_AND_TAG_KEY_NORMALIZATION_REGEX;
exports.SET_METRIC_TYPE = SET_METRIC_TYPE;
exports.TAG_VALUE_NORMALIZATION_REGEX = TAG_VALUE_NORMALIZATION_REGEX;
//# sourceMappingURL=constants.js.map
