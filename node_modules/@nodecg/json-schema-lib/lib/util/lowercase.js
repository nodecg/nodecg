'use strict';

module.exports = lowercase;

/**
 * Returns the given string in lowercase, or null if the value is not a string.
 *
 * @param {*} str
 * @returns {string|null}
 */
function lowercase (str) {
  if (str && typeof str === 'string') {
    return str.toLowerCase();
  }
  else {
    return null;
  }
}
