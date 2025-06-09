'use strict';

var File = require('../File');
var typeOf = require('../../util/typeOf');
var stripHash = require('../../util/stripHash');

module.exports = resolveFileReferences;

/**
 * Resolves all JSON References ($ref) to other files, and adds new {@link File} objects
 * to the schema as needed.
 *
 * @param {File} file - The file to search for JSON References
 */
function resolveFileReferences (file) {
  // Start crawling at the root of the file
  crawl(file.data, file);
}

/**
 * Recursively crawls the given value, and resolves any external JSON References.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {File} file - The file that the value is part of
 */
function crawl (obj, file) {
  var type = typeOf(obj);

  if (!type.isPOJO && !type.isArray) {
    return;
  }

  if (type.isPOJO && isFileReference(obj)) {
    // We found a file reference, so resolve it
    resolveFileReference(obj.$ref, file);
  }

  // Crawl this POJO or Array, looking for nested JSON References
  //
  // NOTE: According to the spec, JSON References should not have any properties other than "$ref".
  //       However, in practice, many schema authors DO add additional properties. Because of this,
  //       we crawl JSON Reference objects just like normal POJOs. If the schema author has added
  //       additional properties, then they have opted-into this non-spec-compliant behavior.
  var keys = Object.keys(obj);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = obj[key];
    crawl(value, file);
  }
}

/**
 * Determines whether the given value is a JSON Reference that points to a file
 * (as opposed to an internal reference, which points to a location within its own file).
 *
 * @param {*} value - The value to inspect
 * @returns {boolean}
 */
function isFileReference (value) {
  return typeof value.$ref === 'string' && value.$ref[0] !== '#';
}

/**
 * Resolves the given JSON Reference URL against the specified file, and adds a new {@link File}
 * object to the schema if necessary.
 *
 * @param {string} url - The JSON Reference URL (may be absolute or relative)
 * @param {File} file - The file that the JSON Reference is in
 */
function resolveFileReference (url, file) {
  var schema = file.schema;
  var newFile = new File(schema);

  // Remove any hash from the URL, since this URL represents the WHOLE file, not a fragment of it
  url = stripHash(url);

  // Resolve the new file's absolute URL
  newFile.url = schema.plugins.resolveURL({ from: file.url, to: url });

  // Add this file to the schema, unless it already exists
  if (!schema.files.exists(newFile)) {
    schema.files.push(newFile);
  }
}
