Object.defineProperty(exports, '__esModule', { value: true });

const utils = require('@sentry/utils');
const constants = require('../constants.js');

/**
 * Creates a dynamic sampling context from a client.
 *
 * Dispatchs the `createDsc` lifecycle hook as a side effect.
 */
function getDynamicSamplingContextFromClient(
  trace_id,
  client,
  scope,
) {
  const options = client.getOptions();

  const { publicKey: public_key } = client.getDsn() || {};
  const { segment: user_segment } = (scope && scope.getUser()) || {};

  const dsc = utils.dropUndefinedKeys({
    environment: options.environment || constants.DEFAULT_ENVIRONMENT,
    release: options.release,
    user_segment,
    public_key,
    trace_id,
  }) ;

  client.emit && client.emit('createDsc', dsc);

  return dsc;
}

exports.getDynamicSamplingContextFromClient = getDynamicSamplingContextFromClient;
//# sourceMappingURL=dynamicSamplingContext.js.map
