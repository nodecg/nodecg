'use strict';

var typeOf = require('./typeOf');

module.exports = deepAssign;

/**
 * Deeply assigns the properties of the source object to the target object
 *
 * @param {object} target
 * @param {object} source
 */
function deepAssign (target, source) {
  var keys = Object.keys(source);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var oldValue = target[key];
    var newValue = source[key];

    target[key] = deepClone(newValue, oldValue);
  }

  return target;
}

/**
 * Returns a deep clone of the given value
 *
 * @param {*} value
 * @param {*} oldValue
 * @returns {*}
 */
function deepClone (value, oldValue) {
  var type = typeOf(value);
  var clone;

  if (type.isPOJO) {
    var oldType = typeOf(oldValue);
    if (oldType.isPOJO) {
      // Return a merged clone of the old POJO and the new POJO
      clone = deepAssign({}, oldValue);
      return deepAssign(clone, value);
    }
    else {
      return deepAssign({}, value);
    }
  }
  else if (type.isArray) {
    clone = [];
    for (var i = 0; i < value.length; i++) {
      clone.push(deepClone(value[i]));
    }
  }
  else if (type.hasValue) {
    // string, boolean, number, function, Date, RegExp, etc.
    // Just return it as-is
    return value;
  }
}
