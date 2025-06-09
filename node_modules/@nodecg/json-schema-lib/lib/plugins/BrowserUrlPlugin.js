'use strict';

var stripHash = require('../util/stripHash');

// Matches any RFC 3986 URL with a scheme (e.g. "http://", "ftp://", "file://")
var protocolPattern = /^[a-z][a-z\d\+\-\.]*:\/\//i;

/**
 * This plugin resolves URLs using the WHATWG URL API, if supported by the current browser.
 * Relative URLs are resolved against the browser's curreng page URL.
 */
module.exports = {
  name: 'BrowserUrlPlugin',

  /**
   * This plugin's priority is the same as the NodeUrlPlugin's priority, for consistency between the
   * Node.js and web browser functionality.
   */
  priority: 20,

  /**
   * Resolves a URL, relative to a base URL.
   *
   * @param {?string} args.from
   * The base URL to resolve against. If unset, then the current page URL is used.
   *
   * @param {string} args.to
   * The URL to resolve. This may be absolute or relative. If relative, then it will be resolved
   * against {@link args.from}
   *
   * @param {function} args.next
   * Calls the next plugin, if the URL is not an HTTP or HTTPS URL.
   *
   * @returns {string|undefined}
   */
  resolveURL: function resolveURL (args) {
    var from = args.from;
    var to = args.to;

    if (typeof URL === 'function') {
      // This browser supports the WHATWG URL API
      return new URL(to, from || location.href).href;
    }
    else if (protocolPattern.test(to)) {
      // It's an absolute URL, so return it as-is
      return to;
    }
    else if (to.substr(0, 2) === '//') {
      return resolveProtocolRelativeURL(from, to);
    }
    else if (to[0] === '/') {
      return resolveOriginRelativeURL(from, to);
    }
    else {
      return resolvePathRelativeURL(from, to);
    }
  },
};

/**
 * Resolves a protocol-relative URL, such as "//example.com/directory/file.json".
 *
 * @param {?string} absolute - The absolute URL to resolve against. Defaults to the current page URL.
 * @param {string} relative - The relative URL to resolve
 * @returns {string}
 */
function resolveProtocolRelativeURL (absolute, relative) {
  var protocol;

  if (absolute) {
    // Get the protocol from the absolute URL
    protocol = protocolPattern.exec(absolute)[0];
  }
  else {
    // Use the current page's protocol
    protocol = location.protocol;
  }

  return protocol + relative;
}

/**
 * Resolves an origin-relative URL, such as "/file.json", "/dir/subdir/file.json", etc.
 *
 * @param {?string} absolute - The absolute URL to resolve against. Defaults to the current page URL.
 * @param {string} relative - The relative URL to resolve
 * @returns {string}
 */
function resolveOriginRelativeURL (absolute, relative) {
  var origin;

  if (absolute) {
    // Get the origin from the absolute URL by joining the first 3 segments (e.g. "http", "", "example.com")
    origin = absolute.split('/').splice(0, 3).join('/');
  }
  else {
    // Use the current page's origin
    origin = location.origin || (location.protocol + location.host);
  }

  return origin + relative;
}

/**
 * Resolves a path-relative URL, such as "file.json", "../file.json", "../dir/subdir/file.json", etc.
 *
 * @param {?string} absolute - The absolute URL to resolve against. Defaults to the current page URL.
 * @param {string} relative - The relative URL to resolve
 * @returns {string}
 */
function resolvePathRelativeURL (absolute, relative) {
  // If there's no absolute URL, then use the current page URL (without query or hash)
  if (!absolute) {
    absolute = stripHash(stripQuery(location.href));
  }

  var absoluteSegments = absolute.split('/');
  var relativeSegments = relative.split('/');

  // The first 3 segments of the absolute URL are the origin (e.g. "http://www.example.com")
  var origin = absoluteSegments.splice(0, 3).join('/');

  // Remove the file name from the absolute URL, so it's just a directory
  absoluteSegments.pop();

  // Add each segment of the relative URL to the absolute URL, accounting for "." and ".." segments
  for (var i = 0; i < relativeSegments.length; i++) {
    var segment = relativeSegments[i];

    switch (segment) {
      case '.':
        break;
      case '..':
        absoluteSegments.pop();
        break;
      default:
        absoluteSegments.push(segment);
    }
  }

  return origin + '/' + absoluteSegments.join('/');
}

function stripQuery (url) {
  var queryIndex = url.indexOf('?');
  if (queryIndex >= 0) {
    url = url.substr(0, queryIndex);
  }
  return url;
}
