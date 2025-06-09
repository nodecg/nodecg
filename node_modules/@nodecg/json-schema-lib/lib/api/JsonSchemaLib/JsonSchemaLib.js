'use strict';

var Config = require('../Config');
var PluginManager = require('../PluginManager');
var read = require('./read');
var normalizeArgs = require('./normalizeArgs');

module.exports = JsonSchemaLib;

/**
 * The public JsonSchemaLib API.
 *
 * @param {Config} [config] - The configuration to use. Can be overridden by {@link JsonSchemaLib#read}
 * @param {object[]} [plugins] - The plugins to use. Additional plugins can be added via {@link JsonSchemaLib#use}
 *
 * @class
 */
function JsonSchemaLib (config, plugins) {
  if (plugins === undefined && Array.isArray(config)) {
    plugins = config;
    config = undefined;
  }

  /**
   * The configuration for this instance of {@link JsonSchemaLib}.
   *
   * @type {Config}
   */
  this.config = new Config(config);

  /**
   * The plugins that have been added to this instance of {@link JsonSchemaLib}
   *
   * @type {object[]}
   */
  this.plugins = new PluginManager(plugins);
}

/**
 * Adds a plugin to this {@link JsonSchemaLib} instance.
 *
 * @param {object} plugin - A plugin object
 * @param {number} [priority] - Optionaly override the plugin's default priority.
 */
JsonSchemaLib.prototype.use = function use (plugin, priority) {
  this.plugins.use(plugin, priority);
};

/**
 * Serializes the {@link JsonSchemaLib} instance
 *
 * @returns {object}
 */
JsonSchemaLib.prototype.toJSON = function toJSON () {
  return {
    config: this.config,
    plugins: this.plugins,
  };
};

/**
 * Synchronously reads the given file, URL, or data, including any other files or URLs that are
 * referneced by JSON References ($ref).
 *
 * @param {string} [url]
 * The file path or URL of the JSON schema
 *
 * @param {object|string} [data]
 * The JSON schema, as an object, or as a JSON/YAML string. If you omit this, then the data will
 * be read from `url` instead.
 *
 * @param {Config} [config]
 * Config that determine how the schema will be read
 *
 * @returns {Schema}
 */
JsonSchemaLib.prototype.readSync = function readSync (url, data, config) {
  var args = normalizeArgs(arguments);
  var error = args.error;

  url = args.url;
  data = args.data;
  config = args.config;

  config.sync = true;

  if (error) {
    // The arguments are invalid
    throw error;
  }
  else {
    var e, s;

    // Call `read()` synchronously, and capture the result
    read.call(this, url, data, config, function (err, schema) {
      e = err;
      s = schema;
    });

    // Return the result synchronously
    if (e) {
      throw e;
    }
    else {
      return s;
    }
  }
};

/**
 * Asynchronously reads the given file, URL, or data, including any other files or URLs that are
 * referneced by JSON References ($ref).
 *
 * @param {string} [url]
 * The file path or URL of the JSON schema
 *
 * @param {object|string} [data]
 * The JSON schema, as an object, or as a JSON/YAML string. If you omit this, then the data will
 * be read from `url` instead.
 *
 * @param {Config} [config]
 * Config that determine how the schema will be read
 *
 * @param {function} [callback]
 * An error-first callback. If not specified, then a Promise will be returned.
 *
 * @returns {Promise<Schema>|undefined}
 */
JsonSchemaLib.prototype.read = JsonSchemaLib.prototype.readAsync = function readAsync (url, data, config, callback) {
  var args = normalizeArgs(arguments);
  var error = args.error;
  var me = this;

  url = args.url;
  data = args.data;
  config = args.config;
  callback = args.callback;

  config.sync = false;

  if (error) {
    // The arguments are invalid
    if (callback) {
      callAsync(callback, error);
    }
    else {
      return config.Promise.reject(error);
    }
  }
  else if (callback) {
    try {
      // Call `read()`, and forward the result to the callback
      read.call(this, url, data, config, function (err, schema) {
        callAsync(callback, err, schema);
      });
    }
    catch (err) {
      // `read()` threw an error, so forward it to the callback
      callAsync(callback, err);
    }
  }
  else {
    // Wrap `read()` in a Promise
    return new config.Promise(function (resolve, reject) {
      read.call(me, url, data, config, function (err, schema) {
        if (err) {
          reject(err);
        }
        else {
          resolve(schema);
        }
      });
    });
  }
};

/**
 * Calls the callback function, wrapping it in a `setTimeout` to ensure that it's not
 * called synchronously.
 *
 * @param {function} fn
 * @param {Error} [error]
 * @param {Schema} [schema]
 */
function callAsync (fn, error, schema) {
  setTimeout(function () {
    fn(error, schema);
  }, 0);
}
