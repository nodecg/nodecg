import { convertIntegrationFnToClass } from '../integration.js';
import { BrowserMetricsAggregator } from './browser-aggregator.js';

const INTEGRATION_NAME = 'MetricsAggregator';

const metricsAggregatorIntegration = () => {
  return {
    name: INTEGRATION_NAME,
    setup(client) {
      client.metricsAggregator = new BrowserMetricsAggregator(client);
    },
  };
};

/**
 * Enables Sentry metrics monitoring.
 *
 * @experimental This API is experimental and might having breaking changes in the future.
 */
// eslint-disable-next-line deprecation/deprecation
const MetricsAggregator = convertIntegrationFnToClass(INTEGRATION_NAME, metricsAggregatorIntegration);

export { MetricsAggregator };
//# sourceMappingURL=integration.js.map
