import { applyAggregateErrorsToEvent, exceptionFromError } from '@sentry/utils';
import { convertIntegrationFnToClass } from '../integration.js';

const DEFAULT_KEY = 'cause';
const DEFAULT_LIMIT = 5;

const INTEGRATION_NAME = 'LinkedErrors';

const linkedErrorsIntegration = (options = {}) => {
  const limit = options.limit || DEFAULT_LIMIT;
  const key = options.key || DEFAULT_KEY;

  return {
    name: INTEGRATION_NAME,
    preprocessEvent(event, hint, client) {
      const options = client.getOptions();

      applyAggregateErrorsToEvent(
        exceptionFromError,
        options.stackParser,
        options.maxValueLength,
        key,
        limit,
        event,
        hint,
      );
    },
  };
};

/** Adds SDK info to an event. */
// eslint-disable-next-line deprecation/deprecation
const LinkedErrors = convertIntegrationFnToClass(INTEGRATION_NAME, linkedErrorsIntegration);

export { LinkedErrors };
//# sourceMappingURL=linkederrors.js.map
