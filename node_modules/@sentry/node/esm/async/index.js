import { NODE_VERSION } from '../nodeVersion.js';
import { setDomainAsyncContextStrategy } from './domain.js';
import { setHooksAsyncContextStrategy } from './hooks.js';

/**
 * Sets the correct async context strategy for Node.js
 *
 * Node.js >= 14 uses AsyncLocalStorage
 * Node.js < 14 uses domains
 */
function setNodeAsyncContextStrategy() {
  if (NODE_VERSION.major && NODE_VERSION.major >= 14) {
    setHooksAsyncContextStrategy();
  } else {
    setDomainAsyncContextStrategy();
  }
}

export { setNodeAsyncContextStrategy };
//# sourceMappingURL=index.js.map
