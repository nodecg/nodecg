'use strict';

var isTypedArray = require('../util/isTypedArray');

/**
 * This plugin decodes arrays of bytes (such as TypedArrays or ArrayBuffers) to strings, if possible.
 */
module.exports = {
  name: 'ArrayDecoderPlugin',

  /**
   * This plugin has a lower priority than the BufferDecoderPlugin or TextDecoderPlugin, so it will only be used
   * as a final fallback if neither of the other decoders is able to decode the file's data.
   */
  priority: 5,

  /**
   * Decodes the given file's data, in place.
   *
   * @param {File} args.file - The {@link File} to decode.
   * @param {function} args.next - Calls the next plugin, if the file data cannot be decoded
   * @returns {string|undefined}
   */
  decodeFile: function decodeFile (args) {
    var file = args.file;
    var next = args.next;

    if (file.encoding && (isTypedArray(file.data) || Array.isArray(file.data))) {
      try {
        // Normalize the data to 2-byte characters
        var characterArray = new Uint16Array(file.data);

        // Convert the characters to a string
        var string = String.fromCharCode.apply(null, characterArray);

        // Remove the byte order mark, if any
        return stripBOM(string);
      }
      catch (err) {
        // Unknown encoding, so just call the next decoder plugin
        next();
      }
    }
    else {
      // The file data is not a supported data type, so call the next decoder plugin
      next();
    }
  },
};

/**
 * Removes the UTF-16 byte order mark, if any, from a string.
 *
 * @param {string} str
 * @returns {string}
 */
function stripBOM (str) {
  var bom = str.charCodeAt(0);

  // Check for the UTF-16 byte order mark (0xFEFF or 0xFFFE)
  if (bom === 0xFEFF || bom === 0xFFFE) {
    return str.slice(1);
  }

  return str;
}
