'use strict';

module.exports = omit;

/**
 * Returns an object containing all properties of the given object,
 * except for the specified properties to be omitted.
 *
 * @param {object} obj
 * @param {...string} props
 * @returns {object}
 */
function omit (obj, props) {
  props = Array.prototype.slice.call(arguments, 1);
  var keys = Object.keys(obj);
  var newObj = {};

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];

    if (props.indexOf(key) === -1) {
      newObj[key] = obj[key];
    }
  }

  return newObj;
}
