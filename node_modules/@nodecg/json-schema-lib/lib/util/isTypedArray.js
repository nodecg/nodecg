'use strict';

var supportedDataTypes = getSupportedDataTypes();

module.exports = isTypedArray;

/**
 * Determines whether the given object is any of the TypedArray types.
 *
 * @param {*} obj
 * @returns {boolean}
 */
function isTypedArray (obj) {
  if (typeof obj === 'object') {
    for (var i = 0; i < supportedDataTypes.length; i++) {
      if (obj instanceof supportedDataTypes[i]) {
        return true;
      }
    }
  }
}

/**
 * Returns the TypedArray data types that are supported by the current runtime environment.
 *
 * @returns {function[]}
 */
function getSupportedDataTypes () {
  var types = [];

  // NOTE: More frequently-used types come first, to improve lookup speed
  if (typeof Uint8Array === 'function') {
    types.push(Uint8Array);
  }
  if (typeof Uint16Array === 'function') {
    types.push(Uint16Array);
  }
  if (typeof ArrayBuffer === 'function') {
    types.push(ArrayBuffer);
  }
  if (typeof Uint32Array === 'function') {
    types.push(Uint32Array);
  }
  if (typeof Int8Array === 'function') {
    types.push(Int8Array);
  }
  if (typeof Int16Array === 'function') {
    types.push(Int16Array);
  }
  if (typeof Int32Array === 'function') {
    types.push(Int32Array);
  }
  if (typeof Uint8ClampedArray === 'function') {
    types.push(Uint8ClampedArray);
  }
  if (typeof Float32Array === 'function') {
    types.push(Float32Array);
  }
  if (typeof Float64Array === 'function') {
    types.push(Float64Array);
  }
  if (typeof DataView === 'function') {
    types.push(DataView);
  }

  return types;
}
