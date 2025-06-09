'use strict';

module.exports = Object.assign || assign;

/**
 * Assigns the properties of the source object to the target object
 *
 * @param {object} target
 * @param {object} source
 */
function assign (target, source) {
  var keys = Object.keys(source);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    target[key] = source[key];
  }

  return target;
}
