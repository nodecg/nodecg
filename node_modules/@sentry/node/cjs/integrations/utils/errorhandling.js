Object.defineProperty(exports, '__esModule', { value: true });

const core = require('@sentry/core');
const utils = require('@sentry/utils');
const debugBuild = require('../../debug-build.js');

const DEFAULT_SHUTDOWN_TIMEOUT = 2000;

/**
 * @hidden
 */
function logAndExitProcess(error) {
  utils.consoleSandbox(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  });

  const client = core.getClient();

  if (client === undefined) {
    debugBuild.DEBUG_BUILD && utils.logger.warn('No NodeClient was defined, we are exiting the process now.');
    global.process.exit(1);
  }

  const options = client.getOptions();
  const timeout =
    (options && options.shutdownTimeout && options.shutdownTimeout > 0 && options.shutdownTimeout) ||
    DEFAULT_SHUTDOWN_TIMEOUT;
  client.close(timeout).then(
    (result) => {
      if (!result) {
        debugBuild.DEBUG_BUILD && utils.logger.warn('We reached the timeout for emptying the request buffer, still exiting now!');
      }
      global.process.exit(1);
    },
    error => {
      debugBuild.DEBUG_BUILD && utils.logger.error(error);
    },
  );
}

exports.logAndExitProcess = logAndExitProcess;
//# sourceMappingURL=errorhandling.js.map
