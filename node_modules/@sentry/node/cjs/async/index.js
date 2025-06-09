Object.defineProperty(exports, '__esModule', { value: true });

const nodeVersion = require('../nodeVersion.js');
const domain = require('./domain.js');
const hooks = require('./hooks.js');

/**
 * Sets the correct async context strategy for Node.js
 *
 * Node.js >= 14 uses AsyncLocalStorage
 * Node.js < 14 uses domains
 */
function setNodeAsyncContextStrategy() {
  if (nodeVersion.NODE_VERSION.major && nodeVersion.NODE_VERSION.major >= 14) {
    hooks.setHooksAsyncContextStrategy();
  } else {
    domain.setDomainAsyncContextStrategy();
  }
}

exports.setNodeAsyncContextStrategy = setNodeAsyncContextStrategy;
//# sourceMappingURL=index.js.map
