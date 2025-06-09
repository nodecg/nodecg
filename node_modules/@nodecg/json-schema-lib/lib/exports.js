'use strict';

var JsonSchemaLib = require('./api/JsonSchemaLib/JsonSchemaLib');
var Schema = require('./api/Schema');
var File = require('./api/File');

/**
 * The default instance of {@link JsonSchemaLib}
 *
 * @type {JsonSchemaLib}
 */
module.exports = createJsonSchemaLib();

// Bind the "read" methods of the default instance, so they can be used as standalone functions
module.exports.read = JsonSchemaLib.prototype.read.bind(module.exports);
module.exports.readAsync = JsonSchemaLib.prototype.readAsync.bind(module.exports);
module.exports.readSync = JsonSchemaLib.prototype.readSync.bind(module.exports);

/**
 * Allows ES6 default import syntax (for Babel, TypeScript, etc.)
 *
 * @type {JsonSchemaLib}
 */
module.exports.default = module.exports;

/**
 * Factory function for creating new instances of {@link JsonSchemaLib}
 */
module.exports.create = createJsonSchemaLib;

/**
 * Utility methods for plugin developers
 */
module.exports.util = {
  /**
   * Determines whether the given value is a {@link Schema} object
   *
   * @param {*} value
   * @returns {boolean}
   */
  isSchema: function isSchema (value) {
    return value instanceof Schema;
  },

  /**
   * Determines whether the given value is a {@link File} object
   *
   * @param {*} value
   * @returns {boolean}
   */
  isFile: function isFile (value) {
    return value instanceof File;
  },
};

/**
 * Creates an instance of JsonSchemaLib
 *
 * @param {Config} [config] - The configuration to use. Can be overridden by {@link JsonSchemaLib#read}
 * @param {object[]} [plugins] - The plugins to use. Additional plugins can be added via {@link JsonSchemaLib#use}
 * @returns {JsonSchemaLib}
 */
function createJsonSchemaLib (config, plugins) {
  return new JsonSchemaLib(config, plugins);
}
