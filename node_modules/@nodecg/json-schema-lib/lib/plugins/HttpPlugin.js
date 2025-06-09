'use strict';

var zlib = require('zlib');
var URL = require('url').URL;
var legacyURL = require('url');
var followRedirects = require('follow-redirects');
var lowercase = require('../util/lowercase');
var setHttpMetadata = require('../util/setHttpMetadata');

// Default HTTP headers
var defaultHeaders = {
  // Some servers require a user-agent
  'User-Agent': 'node_js/' + process.version.substr(1),

  // Accept any response type (JSON, YAML, plain-text, binary, etc.)
  Accept: '*/*',

  // Accept compressed responses, if supported by the server
  'Accept-Encoding': 'gzip, deflate',
};

/**
 * This plugin enables downlaoding files from HTTP or HTTPS URLs.
 */
module.exports = {
  name: 'HttpPlugin',

  /**
   * This plugin has a lower priority than the FileSystemPlugin, meaning that JsonSchemaLib will
   * first attempt to interpret URLs as local filesystem paths. If a URL is not a valid filesystem
   * path, then it be handled by this plugin.
   */
  priority: 5,

  /**
   * Asynchronously downlaods a file from an HTTP or HTTPS URL.
   *
   * @param {File} args.file - The {@link File} to read
   * @param {function} args.next - Calls the next plugin, if the file is not a local filesystem file
   */
  readFileAsync: function readFileAsync (args) {
    var file = args.file;
    var config = args.config;
    var next = args.next;
    var url = parseUrl(file.url);
    var transport;

    switch (url.protocol) {
      case 'http:':
        transport = followRedirects.http;
        break;
      case 'https:':
        transport = followRedirects.https;
        break;
      default:
        // It's not an HTTP or HTTPS URL, so let some other plugin handle it
        return next();
    }

    var httpConfig = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: Object.assign({}, defaultHeaders, config.http.headers),
      timeout: config.http.timeout,
      followRedirects: !!config.http.maxRedirects,
      maxRedirects: config.http.maxRedirects,
    };

    var req = transport.get(httpConfig);

    req.on('error', next);

    req.on('timeout', function handleTimeout () {
      req.abort();
    });

    req.once('response', function handleResponse (res) {
      var responseChunks = [];
      var chunksAreStrings = false;

      decompressResponse(res);
      setHttpMetadata(file, res);

      res.on('error', next);

      res.on('data', function handleResponseData (chunk) {
        // Keep track of whether ANY of the chunks are strings (as opposed to Buffers)
        if (typeof chunk === 'string') {
          chunksAreStrings = true;
        }

        responseChunks.push(chunk);
      });

      res.on('end', function handleResponseEnd () {
        try {
          var response;

          if (chunksAreStrings) {
            // Return the response as a string
            response = responseChunks.join('');
          }
          else {
            // Return the response as a Buffer (Uint8Array)
            response = Buffer.concat(responseChunks);
          }

          next(null, response);
        }
        catch (err) {
          next(err);
        }
      });
    });
  },
};

/**
 * Parses the given URL, using either the legacy Node.js url API, or the WHATWG URL API.
 *
 * @param {string} url
 * @returns {object}
 */
function parseUrl (url) {
  if (typeof URL === 'function') {
    // Use the new WHATWG URL API
    return new URL(url);
  }
  else {
    // Use the legacy url API
    var parsed = legacyURL.parse(url);

    // Replace nulls with default values, for compatibility with the WHATWG URL API
    parsed.pathname = parsed.pathname || '/';
    parsed.search = parsed.search || '';
  }
}

/**
 * Adds decompression middleware to the response stream if necessary.
 *
 * @param {IncomingMessage} res
 */
function decompressResponse (res) {
  var encoding = lowercase(res.headers['content-encoding']);
  var isCompressed = ['gzip', 'compress', 'deflate'].indexOf(encoding) >= 0;

  if (isCompressed) {
    // The response is compressed, so add decompression middleware to the stream
    res.pipe(zlib.createUnzip());

    // Remove the content-encoding header, to prevent double-decoding
    delete res.headers['content-encoding'];
  }
}
