'use strict';

var Config = require('./Config');
var PluginHelper = require('./PluginHelper/PluginHelper');
var FileArray = require('./FileArray');

module.exports = Schema;

/**
 * This class represents the entire JSON Schema. It contains information about all the files in the
 * schema, and provides methods to traverse the schema and get/set values within it using
 * JSON Pointers.
 *
 * @param {Config|object} [config] - The config settings that apply to the schema
 * @param {object[]} [plugins] - The plugins to use for the schema
 *
 * @class
 */
function Schema (config, plugins) {
  /**
   * The config settings that apply to this schema.
   *
   * @type {Config}
   */
  this.config = new Config(config);

  /**
   * The plugins to use for this schema.
   *
   * @type {PluginHelper}
   */
  this.plugins = new PluginHelper(plugins, this);

  /**
   * All of the files in the schema, including the main schema file itself
   *
   * @type {File[]}
   * @readonly
   */
  this.files = new FileArray(this);
}

Object.defineProperties(Schema.prototype, {
  /**
   * The parsed JSON Schema.
   *
   * @type {object|null}
   */
  root: {
    configurable: true,
    enumerable: true,
    get: function () {
      if (this.files.length === 0) {
        return null;
      }
      return this.files[0].data;
    }
  },

  /**
   * The URL of the main JSON Schema file.
   *
   * @type {string|null}
   */
  rootURL: {
    configurable: true,
    enumerable: true,
    get: function () {
      if (this.files.length === 0) {
        return null;
      }
      return this.files[0].url;
    }
  },

  /**
   * The main JSON Schema file.
   *
   * @type {File}
   */
  rootFile: {
    configurable: true,
    enumerable: true,
    get: function () {
      return this.files[0] || null;
    }
  },
});

/**
 * Returns a human-friendly representation of the Schema object.
 *
 * @returns {string}
 */
Schema.prototype.toString = function () {
  var rootFile = this.rootFile;
  if (rootFile) {
    return rootFile.toString();
  }
  else {
    return '(empty JSON schema)';
  }
};

/**
 * Determines whether a given value exists in the schema.
 *
 * @param {string} pointer - A JSON Pointer that points to the value to check.
 *                           Or a URL with a url-encoded JSON Pointer in the hash.
 *
 * @returns {boolean}      - Returns true if the value exists, or false otherwise
 */
Schema.prototype.exists = function (pointer) {                                                            // eslint-disable-line no-unused-vars
  // TODO: pointer can be a JSON Pointer (starting with a /) or a URL
};

/**
 * Finds a value in the schema.
 *
 * @param {string} pointer - A JSON Pointer that points to the value to get.
 *                           Or a URL with a url-encoded JSON Pointer in the hash.
 *
 * @returns {*}            - Returns the specified value, which can be ANY JavaScript type, including
 *                           an object, array, string, number, null, undefined, NaN, etc.
 *                           If the value is not found, then an error is thrown.
 */
Schema.prototype.get = function (pointer) {                                                               // eslint-disable-line no-unused-vars
  // TODO: pointer can be a JSON Pointer (starting with a /) or a URL
};

/**
 * Sets a value in the schema.
 *
 * @param {string} pointer - A JSON Pointer that points to the value to set.
 *                           Or a URL with a url-encoded JSON Pointer in the hash.
 *
 * @param {*}      value   - The value to assign. This can be ANY JavaScript type, including
 *                           an object, array, string, number, null, undefined, NaN, etc.
 */
Schema.prototype.set = function (pointer, value) {                                                        // eslint-disable-line no-unused-vars
  // TODO: pointer can be a JSON Pointer (starting with a /) or a URL
};
