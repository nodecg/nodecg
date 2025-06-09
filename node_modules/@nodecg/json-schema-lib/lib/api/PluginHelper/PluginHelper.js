'use strict';

var ono = require('ono');
var assign = require('../../util/assign');
var __internal = require('../../util/internal');
var validatePlugins = require('./validatePlugins');
var callSyncPlugin = require('./callSyncPlugin');
var callAsyncPlugin = require('./callAsyncPlugin');

module.exports = PluginHelper;

/**
 * Helper methods for working with plugins.
 *
 * @param {object[]|null} plugins - The plugins to use
 * @param {Schema} schema - The {@link Schema} to apply the plugins to
 *
 * @class
 * @extends Array
 */
function PluginHelper (plugins, schema) {
  validatePlugins(plugins);
  plugins = plugins || [];

  // Clone the array of plugins, and sort by priority
  var pluginHelper = plugins.slice().sort(sortByPriority);

  /**
   * Internal stuff. Use at your own risk!
   *
   * @private
   */
  pluginHelper[__internal] = {
    /**
     * A reference to the {@link Schema} object
     */
    schema: schema,
  };

  // Return an array that "inherits" from PluginHelper
  return assign(pluginHelper, PluginHelper.prototype);
}

/**
 * Resolves a URL, relative to a base URL.
 *
 * @param {?string} args.from - The base URL to resolve against, if any
 * @param {string} args.to - The URL to resolve. This may be absolute or relative.
 * @returns {string} - Returns an absolute URL
 */
PluginHelper.prototype.resolveURL = function resolveURL (args) {
  try {
    var handled = callSyncPlugin(this, 'resolveURL', args);
    var url = handled.result;
    var plugin = handled.plugin || { name: '' };

    if (url === undefined || url === null) {
      throw ono('Error in %s.resolveURL: No value was returned', plugin.name);
    }
    else if (typeof url !== 'string') {
      throw ono('Error in %s.resolveURL: The return value was not a string (%s)', plugin.name, typeof url);
    }
    else {
      return url;
    }
  }
  catch (err) {
    throw ono(err, 'Unable to resolve %s', args.to);
  }
};

/**
 * Synchronously reads the given file from its source (e.g. web server, filesystem, etc.)
 *
 * @param {File} args.file - The {@link File} to read
 */
PluginHelper.prototype.readFileSync = function readFileSync (args) {
  try {
    var handled = callSyncPlugin(this, 'readFileSync', args);

    if (!handled.plugin) {
      throw ono('Error in readFileSync: No plugin was able to read the file');
    }
    else {
      // The file was read successfully, so set the file's data
      args.file.data = handled.result;
    }
  }
  catch (err) {
    throw ono(err, 'Unable to read %s', args.file.url);
  }
};

/**
 * Asynchronously reads the given file from its source (e.g. web server, filesystem, etc.)
 *
 * @param {File} args.file
 * The {@link File} to read. Its {@link File#data} property will be set to the file's contents.
 * In addition, {@link File#mimeType} and {@link File#encoding} may be set, if determinable.
 *
 * @param {function} callback
 * The callback function to call after the file has been read
 */
PluginHelper.prototype.readFileAsync = function readFileAsync (args, callback) {
  callAsyncPlugin(this, 'readFileAsync', args, function (err, handled) {
    if (!err && !handled.plugin) {
      err = ono('Error in readFileAsync: No plugin was able to read the file');
    }

    if (err) {
      err = ono(err, 'Unable to read %s', args.file.url);
      callback(err);
    }
    else {
      if (handled.plugin) {
        // The file was read successfully, so set the file's data
        args.file.data = handled.result;
      }

      callback(null);
    }
  });
};

/**
 * Decodes the given file's data, in place.
 *
 * @param {File} args.file - The {@link File} to decode.
 */
PluginHelper.prototype.decodeFile = function decodeFile (args) {
  try {
    var handled = callSyncPlugin(this, 'decodeFile', args);

    // NOTE: It's ok if no plugin handles this method.
    // The file data will just remain in its "raw" format.
    if (handled.plugin) {
      // The file was decoded successfully, so update the file's data
      args.file.data = handled.result;
    }
  }
  catch (err) {
    throw ono(err, 'Unable to parse %s', args.file.url);
  }
};

/**
 * Parses the given file's data, in place.
 *
 * @param {File} args.file - The {@link File} to parse.
 */
PluginHelper.prototype.parseFile = function parseFile (args) {
  try {
    var handled = callSyncPlugin(this, 'parseFile', args);

    // NOTE: It's ok if no plugin handles this method.
    // The file data will just remain in its "raw" format.
    if (handled.plugin) {
      // The file was parsed successfully, so update the file's data
      args.file.data = handled.result;
    }
  }
  catch (err) {
    throw ono(err, 'Unable to parse %s', args.file.url);
  }
};

/**
 * Performs final cleanup steps on the schema after all files have been read successfully.
 */
PluginHelper.prototype.finished = function finished () {
  try {
    // NOTE: It's ok if no plugin handles this method.
    // It's just an opportunity for plugins to perform cleanup tasks if necessary.
    callSyncPlugin(this, 'finished', {});
  }
  catch (err) {
    throw ono(err, 'Error finalizing schema');
  }
};

/**
 * Used to sort plugins by priority, so that plugins with higher piority come first
 * in the __plugins array.
 *
 * @param {object} pluginA
 * @param {object} pluginB
 * @returns {number}
 */
function sortByPriority (pluginA, pluginB) {
  return (pluginB.priority || 0) - (pluginA.priority || 0);
}
