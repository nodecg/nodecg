import { _optionalChain } from '@sentry/utils';
import * as domain from 'domain';
import { setAsyncContextStrategy, ensureHubOnCarrier, getHubFromCarrier, setHubOnCarrier } from '@sentry/core';

function getActiveDomain() {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
  return (domain ).active ;
}

function getCurrentHub() {
  const activeDomain = getActiveDomain();

  // If there's no active domain, just return undefined and the global hub will be used
  if (!activeDomain) {
    return undefined;
  }

  ensureHubOnCarrier(activeDomain);

  return getHubFromCarrier(activeDomain);
}

function createNewHub(parent) {
  const carrier = {};
  ensureHubOnCarrier(carrier, parent);
  return getHubFromCarrier(carrier);
}

function runWithAsyncContext(callback, options) {
  const activeDomain = getActiveDomain();

  if (activeDomain && _optionalChain([options, 'optionalAccess', _ => _.reuseExisting])) {
    // We're already in a domain, so we don't need to create a new one, just call the callback with the current hub
    return callback();
  }

  const local = domain.create() ;

  const parentHub = activeDomain ? getHubFromCarrier(activeDomain) : undefined;
  const newHub = createNewHub(parentHub);
  setHubOnCarrier(local, newHub);

  return local.bind(() => {
    return callback();
  })();
}

/**
 * Sets the async context strategy to use Node.js domains.
 */
function setDomainAsyncContextStrategy() {
  setAsyncContextStrategy({ getCurrentHub, runWithAsyncContext });
}

export { setDomainAsyncContextStrategy };
//# sourceMappingURL=domain.js.map
