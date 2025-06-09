import { logger, consoleSandbox } from '@sentry/utils';
import { DEBUG_BUILD } from './debug-build.js';
import { getCurrentHub } from './hub.js';

/** A class object that can instantiate Client objects. */

/**
 * Internal function to create a new SDK client instance. The client is
 * installed and then bound to the current scope.
 *
 * @param clientClass The client class to instantiate.
 * @param options Options to pass to the client.
 */
function initAndBind(
  clientClass,
  options,
) {
  if (options.debug === true) {
    if (DEBUG_BUILD) {
      logger.enable();
    } else {
      // use `console.warn` rather than `logger.warn` since by non-debug bundles have all `logger.x` statements stripped
      consoleSandbox(() => {
        // eslint-disable-next-line no-console
        console.warn('[Sentry] Cannot initialize SDK with `debug` option using a non-debug bundle.');
      });
    }
  }
  const hub = getCurrentHub();
  const scope = hub.getScope();
  scope.update(options.initialScope);

  const client = new clientClass(options);
  hub.bindClient(client);
}

export { initAndBind };
//# sourceMappingURL=sdk.js.map
