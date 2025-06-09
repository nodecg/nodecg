'use strict';

var isTypedArray = require('../util/isTypedArray');

// Determine whether the current runtime environment supports the TextDecoder API
var textDecoderIsSupported = typeof TextDecoder === 'function';

/**
 * This plugin uses the TextDecoder API to decode arrays of bytes (such as TypedArrays or ArrayBuffers)
 * to strings, if possible.
 */
module.exports = {
  name: 'TextDecoderPlugin',

  /**
   * This plugin has a higher priority than the ArrayDecoderPlugin, since the TextDecoder API is the preferred
   * method for decoding arrays of bytes in browsers that support it.
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
    var decoder;

    if (textDecoderIsSupported && file.encoding && isTypedArray(file.data)) {
      try {
        // Attempt to create a TextDecoder for this encoding
        decoder = new TextDecoder(file.encoding, { ignoreBOM: false, fatal: true });
      }
      catch (err) {
        // Unknown encoding, so just call the next decoder plugin
        next();
      }

      // Decode the data
      return decoder.decode(file.data);
    }
    else {
      // The file data is not a supported data type, so call the next decoder plugin
      next();
    }
  },
};
