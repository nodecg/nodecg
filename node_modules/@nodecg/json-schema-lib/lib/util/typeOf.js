'use strict';

module.exports = typeOf;

/**
 * Returns information about the type of the given value
 *
 * @param {*} value
 * @returns {{ hasValue: boolean, isArray: boolean, isPOJO: boolean, isNumber: boolean }}
 */
function typeOf (value) {
  var type = {
    hasValue: false,
    isArray: false,
    isPOJO: false,
    isNumber: false,
  };

  if (value !== undefined && value !== null) {
    type.hasValue = true;
    var typeName = typeof value;

    if (typeName === 'number') {
      type.isNumber = !isNaN(value);
    }
    else if (Array.isArray(value)) {
      type.isArray = true;
    }
    else {
      type.isPOJO =
        (typeName === 'object') &&
        !(value instanceof RegExp) &&
        !(value instanceof Date);
    }
  }

  return type;
}
