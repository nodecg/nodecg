'use strict';

var URL = require('url').URL;
var legacyURL = require('url');

// Matches any RFC 3986 URL with a scheme (e.g. "http://", "ftp://", "file://")
var protocolPattern = /^[a-z][a-z\d\+\-\.]*:\/\//i;

/**
 * This plugin resolves URLs using the WHATWG URL API or Node's legacy url API.
 */
module.exports = {
  name: 'NodeUrlPlugin',

  /**
   * This plugin has a low priority, to allow for higher-priority third-party resolver plugins.
   *
   * NOTE: Priorities 0 - 99 are reserved for JsonSchemaLib.
   *       Third-party plugins should have priorities of 100 or greater.
   */
  priority: 20,

  /**
   * Resolves a URL, relative to a base URL.
   *
   * @param {?string} args.from
   * The base URL to resolve against. If unset, then {@link args.to} MUST be absolute.
   *
   * @param {string} args.to
   * The URL to resolve. This may be absolute or relative. If relative, then it will be resolved
   * against {@link args.from}
   *
   * @param {function} args.next
   * Calls the next plugin, if the file path is not a URL.
   *
   * @returns {string|undefined}
   */
  resolveURL: function resolveURL (args) {
    var from = args.from;
    var to = args.to;
    var next = args.next;

    if (!isSupportedURL(from) && !isSupportedURL(to)) {
      // It's not a supported URL, so let some other plugin resolve it
      return next();
    }

    if (from) {
      return resolveUrl(from, to);
    }
    else {
      return to;
    }
  },
};

/**
 * Determines whether the given URL is supported.
 * URLs without a scheme (e.g. "//example.com/schema.json") are not supported, since we're running
 * in Node.js, not a browser context.
 *
 * @param {string} url
 * @returns {boolean}
 */
function isSupportedURL (url) {
  return protocolPattern.test(url);
}

/**
 * Resolve the given URL, using either the legacy Node.js url API, or the WHATWG URL API.
 *
 * @param {string} from
 * @param {string} to
 * @returns {string}
 */
function resolveUrl (from, to) {
  if (typeof URL === 'function') {
    // Use the new WHATWG URL API
    return new URL(to, from).href;
  }
  else {
    // Use the legacy url API
    return legacyURL.resolve(from, to);
  }
}
