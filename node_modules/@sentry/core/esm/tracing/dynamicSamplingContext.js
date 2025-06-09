import { dropUndefinedKeys } from '@sentry/utils';
import { DEFAULT_ENVIRONMENT } from '../constants.js';

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

  const dsc = dropUndefinedKeys({
    environment: options.environment || DEFAULT_ENVIRONMENT,
    release: options.release,
    user_segment,
    public_key,
    trace_id,
  }) ;

  client.emit && client.emit('createDsc', dsc);

  return dsc;
}

export { getDynamicSamplingContextFromClient };
//# sourceMappingURL=dynamicSamplingContext.js.map
