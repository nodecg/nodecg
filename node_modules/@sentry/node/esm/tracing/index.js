import { lazyLoadedNodePerformanceMonitoringIntegrations } from '@sentry-internal/tracing';
import { logger } from '@sentry/utils';

/**
 * Automatically detects and returns integrations that will work with your dependencies.
 */
function autoDiscoverNodePerformanceMonitoringIntegrations() {
  const loadedIntegrations = lazyLoadedNodePerformanceMonitoringIntegrations
    .map(tryLoad => {
      try {
        return tryLoad();
      } catch (_) {
        return undefined;
      }
    })
    .filter(integration => !!integration) ;

  if (loadedIntegrations.length === 0) {
    logger.warn('Performance monitoring integrations could not be automatically loaded.');
  }

  // Only return integrations where their dependencies loaded successfully.
  return loadedIntegrations.filter(integration => !!integration.loadDependency());
}

export { autoDiscoverNodePerformanceMonitoringIntegrations };
//# sourceMappingURL=index.js.map
