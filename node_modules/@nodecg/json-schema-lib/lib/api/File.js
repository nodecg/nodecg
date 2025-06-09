'use strict';

var omit = require('../util/omit');
var __internal = require('../util/internal');

module.exports = File;

/**
 * Contains information about a file, such as its path, type, and contents.
 *
 * @param {Schema} schema - The JSON Schema that the file is part of
 *
 * @class
 */
function File (schema) {
  /**
   * The {@link Schema} that this file belongs to.
   *
   * @type {Schema}
   */
  this.schema = schema;

  /**
   * The file's full (absolute) URL, without any hash
   *
   * @type {string}
   */
  this.url = '';

  /**
   * The file's data. This can be any data type, including a string, object, array, binary, etc.
   *
   * @type {*}
   */
  this.data = undefined;

  /**
   * The file's MIME type (e.g. "application/json", "text/html", etc.), if known.
   *
   * @type {?string}
   */
  this.mimeType = undefined;

  /**
   * The file's encoding (e.g. "utf-8", "iso-8859-2", "windows-1251", etc.), if known
   *
   * @type {?string}
   */
  this.encoding = undefined;

  /**
   * Internal stuff. Use at your own risk!
   *
   * @private
   */
  this[__internal] = {
    /**
     * Keeps track of the state of each file as the schema is being read.
     *
     * @type {number}
     */
    state: 0,
  };
}

/**
 * Returns a human-friendly representation of the File object.
 *
 * @returns {string}
 */
File.prototype.toString = function toString () {
  return this.path;
};

/**
 * Serializes the {@link File} instance
 *
 * @returns {object}
 */
File.prototype.toJSON = function toJSON () {
  return omit(this, 'schema', __internal);
};
