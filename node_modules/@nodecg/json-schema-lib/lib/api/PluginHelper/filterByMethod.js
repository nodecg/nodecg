'use strict';

module.exports = filterByMethod;

/**
 * Used to filter plugins that implement the specified method.
 *
 * @param {string} methodName
 * @returns {function}
 */
function filterByMethod (methodName) {
  return function methodFilter (plugin) {
    return typeof plugin[methodName] === 'function';
  };
}
