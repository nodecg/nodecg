Object.defineProperty(exports, '__esModule', { value: true });

const integration = require('../integration.js');
const browserAggregator = require('./browser-aggregator.js');

const INTEGRATION_NAME = 'MetricsAggregator';

const metricsAggregatorIntegration = () => {
  return {
    name: INTEGRATION_NAME,
    setup(client) {
      client.metricsAggregator = new browserAggregator.BrowserMetricsAggregator(client);
    },
  };
};

/**
 * Enables Sentry metrics monitoring.
 *
 * @experimental This API is experimental and might having breaking changes in the future.
 */
// eslint-disable-next-line deprecation/deprecation
const MetricsAggregator = integration.convertIntegrationFnToClass(INTEGRATION_NAME, metricsAggregatorIntegration);

exports.MetricsAggregator = MetricsAggregator;
//# sourceMappingURL=integration.js.map
