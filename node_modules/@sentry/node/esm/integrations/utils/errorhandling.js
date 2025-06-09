import { getClient } from '@sentry/core';
import { consoleSandbox, logger } from '@sentry/utils';
import { DEBUG_BUILD } from '../../debug-build.js';

const DEFAULT_SHUTDOWN_TIMEOUT = 2000;

/**
 * @hidden
 */
function logAndExitProcess(error) {
  consoleSandbox(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  });

  const client = getClient();

  if (client === undefined) {
    DEBUG_BUILD && logger.warn('No NodeClient was defined, we are exiting the process now.');
    global.process.exit(1);
  }

  const options = client.getOptions();
  const timeout =
    (options && options.shutdownTimeout && options.shutdownTimeout > 0 && options.shutdownTimeout) ||
    DEFAULT_SHUTDOWN_TIMEOUT;
  client.close(timeout).then(
    (result) => {
      if (!result) {
        DEBUG_BUILD && logger.warn('We reached the timeout for emptying the request buffer, still exiting now!');
      }
      global.process.exit(1);
    },
    error => {
      DEBUG_BUILD && logger.error(error);
    },
  );
}

export { logAndExitProcess };
//# sourceMappingURL=errorhandling.js.map
