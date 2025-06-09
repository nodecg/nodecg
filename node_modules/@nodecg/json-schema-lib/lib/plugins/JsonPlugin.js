'use strict';

// Matches "application/json", "text/json", "application/hal+json", etc.
var mimeTypePattern = /[/+]json$/;

// Matches any URL that ends with ".json" (ignoring the query and hash)
var extensionPattern = /^[^\?\#]+\.json(\?.*)?$/;

/**
 * This plugin parses JSON files
 */
module.exports = {
  name: 'JsonPlugin',

  /**
   * This plugin has a low priority, to allow for higher-priority third-party parser plugins.
   *
   * NOTE: Priorities 0 - 99 are reserved for JsonSchemaLib.
   *       Third-party plugins should have priorities of 100 or greater.
   */
  priority: 20,

  /**
   * Parses the given file's data, in place.
   *
   * @param {File} args.file - The {@link File} to parse.
   * @param {function} args.next - Calls the next plugin, if the file data cannot be parsed
   * @returns {*}
   */
  parseFile: function parseFile (args) {
    var file = args.file;
    var next = args.next;

    try {
      // Optimistically try to parse the file as JSON.
      return JSON.parse(file.data);
    }
    catch (error) {
      if (isJsonFile(file)) {
        // This is a JSON file, but its contents are invalid
        throw error;
      }
      else {
        // This probably isn't a JSON file, so call the next parser plugin
        next();
      }
    }
  },
};

/**
 * Determines whether the file data is JSON
 *
 * @param {File} file
 * @returns {boolean}
 */
function isJsonFile (file) {
  return file.data &&                             // The file has data
    (typeof file.data === 'string') &&            // and it's a string
    (
      mimeTypePattern.test(file.mimeType) ||      // and it has a JSON MIME type
      extensionPattern.test(file.url)             // or at least a .json file extension
    );
}
