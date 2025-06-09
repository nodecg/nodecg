'use strict';

var ono = require('ono');
var Config = require('../Config');

module.exports = normalizeArgs;

/**
 * Normalizes arguments for the {@link JsonSchemaLib#readAsync} and {@link JsonSchemaLib#readSync}
 * methods, accounting for optional args and defaults.
 *
 * NOTE: This function does NOT throw errors. The calling code is responsible for checking the
 * `error` property of the returned object, and handling it appropriately.
 *
 * @param {Arguments} args
 * @returns {{ error: ?Error, url: ?string, data: *, config: Config, callback: ?function }}
 */
function normalizeArgs (args) {
  var error, url, data, config, callback;

  try {
    args = Array.prototype.slice.call(args);

    if (typeof args[args.length - 1] === 'function') {
      // The last parameter is a callback function
      callback = args.pop();
    }

    // If the first parameter is a string, then it could be a URL or a JSON/YAML string
    if (typeof args[0] === 'string' && args[0].trim()[0] !== '{' && args[0].indexOf('\n') === -1) {
      // The first parameter is the URL
      url = args[0];
      args.shift();
    }
    else {
      url = '';
    }

    if (typeof args[0] === 'string' || args.length === 2) {
      // The next parameter is the JSON Schema (as a JSON/YAML string, an object, null, undefined, etc.)
      data = args[0];
      args.shift();
    }

    // The next argument is the config. If null/undefined, then the default config will be used instead
    config = new Config(args[0]);
    args.shift();

    // There shouldn't be any more arguments left
    if (args.length > 0) {
      throw ono('Too many arguments. Expected a URL, schema, config, and optional callback.');
    }

    // Either a url or data is required
    if (!url && !data) {
      throw ono('Invalid arguments. Expected at least a URL or schema.');
    }
  }
  catch (e) {
    error = e;
  }

  return {
    error: error,
    url: url,
    data: data,
    config: config,
    callback: callback
  };
}
