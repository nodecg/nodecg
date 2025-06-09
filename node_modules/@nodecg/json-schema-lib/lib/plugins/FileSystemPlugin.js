'use strict';

var fs = require('fs');
var path = require('path');
var mime = require('mime-types');
var lowercase = require('../util/lowercase');

var isWindows = /^win/.test(process.platform);
var forwardSlashPattern = /\//g;

// Matches any RFC 3986 URL, even without a scheme (e.g. "//", http://", "ftp://", "file://")
var protocolPattern = /^([a-z\d\+\-\.]+:)?\/\//i;

// Windows supports "/" and "\" path separators. All other platforms only support "/"
var pathSeparators = isWindows ? ['/', '\\'] : ['/'];

/**
 * This plugin enables reading files from the local filesystem.
 */
module.exports = {
  name: 'FileSystemPlugin',

  /**
   * This plugin has a higher priority than the HttpPlugin, meaning that JsonSchemaLib will first
   * attempt to interpret URLs as local filesystem paths.  If a URL is not a valid filesystem
   * path, then it be handled by the HttpPlugin instead.
   */
  priority: 10,

  /**
   * Resolves a local filesystem path, relative to a base path.
   *
   * @param {?string} args.from
   * The base path to resolve against. If unset, then the current working directory is used.
   *
   * @param {string} args.to
   * The path to resolve. This may be absolute or relative. If relative, then it will be resolved
   * against {@link args.from}
   *
   * @param {function} args.next
   * Calls the next plugin, if the path is not a filesystem path.
   *
   * @returns {string|undefined}
   */
  resolveURL: function resolveURL (args) {
    var from = args.from;
    var to = args.to;
    var next = args.next;

    if (protocolPattern.test(from) || protocolPattern.test(to)) {
      // It's a URL, not a filesystem path, so let some other plugin resolve it
      return next();
    }

    if (from) {
      // The `from` path needs to be a directory, not a file. So, if the last character is NOT a
      // path separator, then we need to remove the filename from the path
      if (pathSeparators.indexOf(from[from.length - 1]) === -1) {
        from = path.dirname(from);
      }

      return path.resolve(from, to);
    }
    else {
      // Resolve the `to` path against the current working directory
      return path.resolve(to);
    }
  },

  /**
   * Synchronously reads a file from the local filesystem.
   *
   * @param {File} args.file - The {@link File} to read
   * @param {function} args.next - Calls the next plugin, if the file is not a local filesystem file
   * @returns {Buffer|undefined}
   */
  readFileSync: function readFileSync (args) {
    var file = args.file;
    var next = args.next;

    if (isUnsupportedPath(file.url)) {
      // It's not a filesystem path, so let some other plugin handle it
      return next();
    }

    var filepath = getFileSystemPath(file.url);

    inferFileMetadata(file);
    return fs.readFileSync(filepath);
  },

  /**
   * Asynchronously reads a file from the local filesystem.
   *
   * @param {File} args.file - The {@link File} to read
   * @param {function} args.next - Calls the next plugin, if the file is not a local filesystem file
   */
  readFileAsync: function readFileSync (args) {
    var file = args.file;
    var next = args.next;

    if (isUnsupportedPath(file.url)) {
      // It's not a filesystem path, so let some other plugin handle it
      return next();
    }

    var filepath = getFileSystemPath(file.url);

    inferFileMetadata(file);
    fs.readFile(filepath, next);
  },
};

/**
 * Determines whether the given URL is a local filesystem path that is supported by this plugin.
 *
 * @param {string} url
 * @returns {boolean}
 */
function isUnsupportedPath (url) {
  // If the URL has any protocol other than "file://", then it's unsupported
  var protocol = protocolPattern.exec(url);
  return protocol && protocol[1].toLowerCase() !== 'file:';
}

/**
 * Infers the file's MIME type and encoding, based on its file extension.
 *
 * @param {File} file
 */
function inferFileMetadata (file) {
  file.mimeType = lowercase(mime.lookup(file.url) || null);
  file.encoding = lowercase(mime.charset(file.mimeType) || null);
}

/**
 * Converts a URL to a local filesystem path.
 * This includes decoding URL-encoded characters (e.g. %20, %26, etc.)
 * and converting from the "file://" protocol to an absolute path.
 *
 * @param {string} url
 * @returns {string}
 */
function getFileSystemPath (url) {
  // Strip-off the "file://" protocol
  url = stripFileProtocol(url);

  // On Windows, normalize all slashes to backslashes
  if (isWindows) {
    url = url.replace(forwardSlashPattern, '\\');
  }

  return url;
}

/**
 * Removes the "file://" protocol from the given URL,
 * resulting in an absolute filesystem path
 *
 * @param {string} url
 * @returns {string}
 */
function stripFileProtocol (url) {
  var isFileUrl = url.substr(0, 7).toLowerCase() === 'file://';

  if (isFileUrl) {
    // Strip-off the protocol, and the initial "/", if there is one
    url = url[7] === '/' ? url.substr(8) : url.substr(7);

    if (isWindows) {
      // Insert a colon (":") after the drive letter, if necessary
      if (url[1] === '/') {
        url = url[0] + ':' + url.substr(1);
      }
    }
    else {
      // It's a Posix path, so start at root
      url = '/' + url;
    }
  }

  return url;
}
