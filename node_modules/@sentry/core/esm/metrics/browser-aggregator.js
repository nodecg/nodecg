import { timestampInSeconds } from '@sentry/utils';
import { DEFAULT_BROWSER_FLUSH_INTERVAL, NAME_AND_TAG_KEY_NORMALIZATION_REGEX } from './constants.js';
import { METRIC_MAP } from './instance.js';
import { sanitizeTags, getBucketKey } from './utils.js';

/**
 * A simple metrics aggregator that aggregates metrics in memory and flushes them periodically.
 * Default flush interval is 5 seconds.
 *
 * @experimental This API is experimental and might change in the future.
 */
class BrowserMetricsAggregator  {
  // TODO(@anonrig): Use FinalizationRegistry to have a proper way of flushing the buckets
  // when the aggregator is garbage collected.
  // Ref: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/FinalizationRegistry

   constructor(  _client) {this._client = _client;
    this._buckets = new Map();
    this._interval = setInterval(() => this.flush(), DEFAULT_BROWSER_FLUSH_INTERVAL);
  }

  /**
   * @inheritDoc
   */
   add(
    metricType,
    unsanitizedName,
    value,
    unit = 'none',
    unsanitizedTags = {},
    maybeFloatTimestamp = timestampInSeconds(),
  ) {
    const timestamp = Math.floor(maybeFloatTimestamp);
    const name = unsanitizedName.replace(NAME_AND_TAG_KEY_NORMALIZATION_REGEX, '_');
    const tags = sanitizeTags(unsanitizedTags);

    const bucketKey = getBucketKey(metricType, name, unit, tags);
    const bucketItem = this._buckets.get(bucketKey);
    if (bucketItem) {
      bucketItem.metric.add(value);
      // TODO(abhi): Do we need this check?
      if (bucketItem.timestamp < timestamp) {
        bucketItem.timestamp = timestamp;
      }
    } else {
      this._buckets.set(bucketKey, {
        // @ts-expect-error we don't need to narrow down the type of value here, saves bundle size.
        metric: new METRIC_MAP[metricType](value),
        timestamp,
        metricType,
        name,
        unit,
        tags,
      });
    }
  }

  /**
   * @inheritDoc
   */
   flush() {
    // short circuit if buckets are empty.
    if (this._buckets.size === 0) {
      return;
    }
    if (this._client.captureAggregateMetrics) {
      // TODO(@anonrig): Use Object.values() when we support ES6+
      const metricBuckets = Array.from(this._buckets).map(([, bucketItem]) => bucketItem);
      this._client.captureAggregateMetrics(metricBuckets);
    }
    this._buckets.clear();
  }

  /**
   * @inheritDoc
   */
   close() {
    clearInterval(this._interval);
    this.flush();
  }
}

export { BrowserMetricsAggregator };
//# sourceMappingURL=browser-aggregator.js.map
