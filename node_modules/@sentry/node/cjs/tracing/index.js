Object.defineProperty(exports, '__esModule', { value: true });

const tracing = require('@sentry-internal/tracing');
const utils = require('@sentry/utils');

/**
 * Automatically detects and returns integrations that will work with your dependencies.
 */
function autoDiscoverNodePerformanceMonitoringIntegrations() {
  const loadedIntegrations = tracing.lazyLoadedNodePerformanceMonitoringIntegrations
    .map(tryLoad => {
      try {
        return tryLoad();
      } catch (_) {
        return undefined;
      }
    })
    .filter(integration => !!integration) ;

  if (loadedIntegrations.length === 0) {
    utils.logger.warn('Performance monitoring integrations could not be automatically loaded.');
  }

  // Only return integrations where their dependencies loaded successfully.
  return loadedIntegrations.filter(integration => !!integration.loadDependency());
}

exports.autoDiscoverNodePerformanceMonitoringIntegrations = autoDiscoverNodePerformanceMonitoringIntegrations;
//# sourceMappingURL=index.js.map
