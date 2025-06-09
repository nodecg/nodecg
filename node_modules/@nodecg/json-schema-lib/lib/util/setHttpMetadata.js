'use strict';

var contentType = require('content-type');
var lowercase = require('../util/lowercase');

module.exports = setHttpMetadata;

/**
 * Sets {@link File} properties, such as {@link File#mimeType} and {@link File#encoding},
 * based on the given HTTP response
 *
 * @param {File} file - The File object whose properties are set
 * @param {IncomingMessage} res - The HTTP response
 */
function setHttpMetadata (file, res) {
  var header = res.headers['content-type'];

  if (header && typeof header === 'string') {
    var parsed = contentType.parse(header);

    file.mimeType = lowercase(parsed.type);
    file.encoding = lowercase(parsed.parameters.charset || null);
  }
}
