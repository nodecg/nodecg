'use strict';

var ono = require('ono');
var typeOf = require('../../util/typeOf');
var validatePlugin = require('./validatePlugin');

module.exports = validatePlugins;

/**
 * Ensures that a user-supplied value is a valid array of plugins.
 * An error is thrown if the value is invalid.
 *
 * @param {*} plugins - The user-supplied value to validate
 */
function validatePlugins (plugins) {
  var type = typeOf(plugins);

  if (type.hasValue) {
    if (type.isArray) {
      // Make sure all the items in the array are valid plugins
      plugins.forEach(validatePlugin);
    }
    else {
      throw ono('Invalid arguments. Expected an array of plugins.');
    }
  }
}
