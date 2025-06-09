'use strict';

module.exports = stripHash;

/**
 * Returns the hash of the given url
 * (e.g. http://example.com/path#hash => http://example.com/path)
 *
 * NOTE: It is the user's responsibility to URL-encode any hash characters in the URL's path.
 * For example, if the user passes-in the following URL:
 *
 *    https://httpbin.org/anything/foo#bar/baz?query=value#hash
 *
 * The returned URL will be "https://httpbin.org/anything/foo".  If the user wants "foo#bar" to
 * simply be treated as a path segment, then they need to escape it first, like this:
 *
 *    https://httpbin.org/anything/foo%23bar/baz?query=value#hash
 *
 * @param {string} url
 * @returns {string}
 */
function stripHash (url) {
  var hashIndex = url.indexOf('#');
  if (hashIndex >= 0) {
    url = url.substr(0, hashIndex);
  }
  return url;
}
