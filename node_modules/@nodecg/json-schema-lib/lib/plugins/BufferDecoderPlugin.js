'use strict';

/**
 * This plugin decodes Node.js {@link Buffer} objects to strings, if possible.
 */
module.exports = {
  name: 'BufferDecoderPlugin',

  /**
   * This plugin has the same priority as the TextDecoderPlugin, which is used in web browsers.
   * The TextDecoder API doesn't exist in Node.js, so {@link Buffer#toString} is used instead.
   */
  priority: 10,

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

    if (file.encoding && Buffer.isBuffer(file.data)) {
      try {
        // Get the file's data as a buffer, minus any byte order mark
        var buffer = stripBOM(file);

        // Attempt to decode the Buffer
        return buffer.toString(file.encoding);
      }
      catch (err) {
        if (/unknown encoding/i.test(err.message)) {
          // Unknown encoding, so just call the next decoder plugin
          next();
        }
        else {
          throw err;
        }
      }
    }
    else {
      // The file data is not a Buffer, so call the next decoder plugin
      next();
    }
  },
};

/**
 * Removes the UTF-8 byte order mark, if any, from a {@link Buffer}.
 *
 * @param {File} file
 * @returns {Buffer}
 */
function stripBOM (file) {
  var buffer = file.data;

  if (file.encoding === 'utf8' || file.encoding === 'utf-8') {
    // Check for the UTF-8 byte order mark (0xEFBBBF)
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      return buffer.slice(3);
    }
  }

  return buffer;
}
