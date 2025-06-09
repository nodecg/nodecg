'use strict';

var ono = require('ono');
var typeOf = require('../../util/typeOf');

module.exports = validatePlugin;

/**
 * Ensures that a user-supplied value is a valid plugin POJO.
 * An error is thrown if the value is invalid.
 *
 * @param {*} plugin - The user-supplied value to validate
 */
function validatePlugin (plugin) {
  var type = typeOf(plugin);

  if (!type.isPOJO) {
    throw ono('Invalid arguments. Expected a plugin object.');
  }
}
