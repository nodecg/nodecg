'use strict';

var ono = require('ono');
var File = require('./File');
var assign = require('../util/assign');
var __internal = require('../util/internal');

module.exports = FileArray;

/**
 * An array of {@link File} objects, with some helper methods.
 *
 * @param {Schema} schema - The JSON Schema that these files are part of
 *
 * @class
 * @extends Array
 */
function FileArray (schema) {
  var fileArray = [];

  /**
   * Internal stuff. Use at your own risk!
   *
   * @private
   */
  fileArray[__internal] = {
    /**
     * A reference to the {@link Schema} object
     */
    schema: schema,
  };

  // Return an array that "inherits" from FileArray
  return assign(fileArray, FileArray.prototype);
}

/**
 * Determines whether a given file is in the array.
 *
 * @param {string|File} url
 * An absolute URL, or a relative URL (relative to the schema's root file), or a {@link File} object
 *
 * @returns {boolean}
 */
FileArray.prototype.exists = function exists (url) {
  if (this.length === 0) {
    return false;
  }

  // Get the absolute URL
  var absoluteURL = resolveURL(url, this[__internal].schema);

  // Try to find a file with this URL
  for (var i = 0; i < this.length; i++) {
    var file = this[i];
    if (file.url === absoluteURL) {
      return true;
    }
  }

  // If we get here, thne no files matched the URL
  return false;
};

/**
 * Returns the given file in the array. Throws an error if not found.
 *
 * @param {string|File} url
 * An absolute URL, or a relative URL (relative to the schema's root file), or a {@link File} object
 *
 * @returns {File}
 */
FileArray.prototype.get = function get (url) {
  if (this.length === 0) {
    throw ono('Unable to get %s. \nThe schema is empty.', url);
  }

  // Get the absolute URL
  var absoluteURL = resolveURL(url, this[__internal].schema);

  // Try to find a file with this URL
  for (var i = 0; i < this.length; i++) {
    var file = this[i];
    if (file.url === absoluteURL) {
      return file;
    }
  }

  // If we get here, then no files matched the URL
  throw ono('Unable to get %s. \nThe schema does not include this file.', absoluteURL);
};

/**
 * Resolves the given URL to an absolute URL.
 *
 * @param {string|File} url
 * An absolute URL, or a relative URL (relative to the schema's root file), or a {@link File} object
 *
 * @param {Schema} schema
 * @returns {boolean}
 */
function resolveURL (url, schema) {
  if (url instanceof File) {
    // The URL is already absolute
    return url.url;
  }

  return schema.plugins.resolveURL({ from: schema.rootURL, to: url });
}
