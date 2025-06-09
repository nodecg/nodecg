/*!
 * Json Schema Lib v0.0.6 (August 16th 2017)
 * 
 * https://github.com/BigstickCarpet/json-schema-lib
 * 
 * @author  James Messinger (http://jamesmessinger.com)
 * @license MIT
 */
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.jsonSchemaLib = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var ono = require('ono');
var typeOf = require('../util/typeOf');
var deepAssign = require('../util/deepAssign');

module.exports = Config;

/**
 * Config that determine how {@link JsonSchemaLib} behaves
 *
 * @param {object} [config] - User-specified config. These override the defaults.
 * @param {object} [defaultConfig] - The default config to use instead of {@link Config.defaults}
 *
 * @class
 */
function Config (config, defaultConfig) {
  validateConfig(config);
  deepAssign(this, defaultConfig || Config.defaults);

  if (config) {
    deepAssign(this, config);
  }
}

/**
 * The default configuration.
 */
Config.defaults = {
  /**
   * The Promise class to use when asynchronous methods are called without a callback.
   * Users can override this with a custom Promise implementation, such as Bluebird
   * or a polyfill.
   *
   * @type {function}
   */
  Promise: require('../util/Promise'),

  /**
   * Options for downloading files via HTTP and HTTPS.
   * These options are used by the HttpPlugin and the XhrPlugin.
   */
  http: {
    /**
     * HTTP headers to send when making HTTP requests.
     */
    headers: {},

    /**
     * The maximum amount of time (in milliseconds) to wait for an HTTP response.
     *
     * @type {number}
     */
    timeout: 5000,

    /**
     * The maximum number of HTTP redirects to follow.
     * If set to zero, then no redirects will be followed.
     *
     * NOTE: This option only applies to Node.js. In a web browser, redirects are automatically
     * followed, and there is no way to disable or limit this.
     *
     * @type {number}
     */
    maxRedirects: 5,

    /**
     * Determines whether HTTP requests should include credentials, such as cookies,
     * authorization headers, TLS certificates, etc.
     *
     * NOTE: This option only applies to web browsers, not Node.js.
     *
     * @type {boolean}
     */
    withCredentials: false,
  },
};

/**
 * Ensures that a user-supplied value is a valid configuration POJO.
 * An error is thrown if the value is invalid.
 *
 * @param {*} config - The user-supplied value to validate
 */
function validateConfig (config) {
  var type = typeOf(config);

  if (type.hasValue && !type.isPOJO) {
    throw ono('Invalid arguments. Expected a configuration object.');
  }
}

},{"../util/Promise":23,"../util/deepAssign":26,"../util/typeOf":34,"ono":37}],2:[function(require,module,exports){
'use strict';

var omit = require('../util/omit');
var __internal = require('../util/internal');

module.exports = File;

/**
 * Contains information about a file, such as its path, type, and contents.
 *
 * @param {Schema} schema - The JSON Schema that the file is part of
 *
 * @class
 */
function File (schema) {
  /**
   * The {@link Schema} that this file belongs to.
   *
   * @type {Schema}
   */
  this.schema = schema;

  /**
   * The file's full (absolute) URL, without any hash
   *
   * @type {string}
   */
  this.url = '';

  /**
   * The file's data. This can be any data type, including a string, object, array, binary, etc.
   *
   * @type {*}
   */
  this.data = undefined;

  /**
   * The file's MIME type (e.g. "application/json", "text/html", etc.), if known.
   *
   * @type {?string}
   */
  this.mimeType = undefined;

  /**
   * The file's encoding (e.g. "utf-8", "iso-8859-2", "windows-1251", etc.), if known
   *
   * @type {?string}
   */
  this.encoding = undefined;

  /**
   * Internal stuff. Use at your own risk!
   *
   * @private
   */
  this[__internal] = {
    /**
     * Keeps track of the state of each file as the schema is being read.
     *
     * @type {number}
     */
    state: 0,
  };
}

/**
 * Returns a human-friendly representation of the File object.
 *
 * @returns {string}
 */
File.prototype.toString = function toString () {
  return this.path;
};

/**
 * Serializes the {@link File} instance
 *
 * @returns {object}
 */
File.prototype.toJSON = function toJSON () {
  return omit(this, 'schema', __internal);
};

},{"../util/internal":27,"../util/omit":30}],3:[function(require,module,exports){
'use strict';

var ono = require('ono');
var File = require('./File');
var assign = require('../util/assign');
var __internal = require('../util/internal');

module.exports = FileArray;

/**
 * An array of {@link File} objects, with some helper methods.
 *
 * @param {Schema} schema - The JSON Schema that these files are part of
 *
 * @class
 * @extends Array
 */
function FileArray (schema) {
  var fileArray = [];

  /**
   * Internal stuff. Use at your own risk!
   *
   * @private
   */
  fileArray[__internal] = {
    /**
     * A reference to the {@link Schema} object
     */
    schema: schema,
  };

  // Return an array that "inherits" from FileArray
  return assign(fileArray, FileArray.prototype);
}

/**
 * Determines whether a given file is in the array.
 *
 * @param {string|File} url
 * An absolute URL, or a relative URL (relative to the schema's root file), or a {@link File} object
 *
 * @returns {boolean}
 */
FileArray.prototype.exists = function exists (url) {
  if (this.length === 0) {
    return false;
  }

  // Get the absolute URL
  var absoluteURL = resolveURL(url, this[__internal].schema);

  // Try to find a file with this URL
  for (var i = 0; i < this.length; i++) {
    var file = this[i];
    if (file.url === absoluteURL) {
      return true;
    }
  }

  // If we get here, thne no files matched the URL
  return false;
};

/**
 * Returns the given file in the array. Throws an error if not found.
 *
 * @param {string|File} url
 * An absolute URL, or a relative URL (relative to the schema's root file), or a {@link File} object
 *
 * @returns {File}
 */
FileArray.prototype.get = function get (url) {
  if (this.length === 0) {
    throw ono('Unable to get %s. \nThe schema is empty.', url);
  }

  // Get the absolute URL
  var absoluteURL = resolveURL(url, this[__internal].schema);

  // Try to find a file with this URL
  for (var i = 0; i < this.length; i++) {
    var file = this[i];
    if (file.url === absoluteURL) {
      return file;
    }
  }

  // If we get here, then no files matched the URL
  throw ono('Unable to get %s. \nThe schema does not include this file.', absoluteURL);
};

/**
 * Resolves the given URL to an absolute URL.
 *
 * @param {string|File} url
 * An absolute URL, or a relative URL (relative to the schema's root file), or a {@link File} object
 *
 * @param {Schema} schema
 * @returns {boolean}
 */
function resolveURL (url, schema) {
  if (url instanceof File) {
    // The URL is already absolute
    return url.url;
  }

  return schema.plugins.resolveURL({ from: schema.rootURL, to: url });
}

},{"../util/assign":25,"../util/internal":27,"./File":2,"ono":37}],4:[function(require,module,exports){
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

},{"../Config":1,"../PluginManager":14,"./normalizeArgs":5,"./read":6}],5:[function(require,module,exports){
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

},{"../Config":1,"ono":37}],6:[function(require,module,exports){
'use strict';

var Schema = require('../Schema');
var File = require('../File');
var safeCall = require('../../util/safeCall');
var stripHash = require('../../util/stripHash');
var __internal = require('../../util/internal');
var resolveFileReferences = require('./resolveFileReferences');

var STATE_READING = 1;
var STATE_READ = 2;

module.exports = read;

/**
 * Reads the given file, URL, or data, including any other files or URLs that are referneced
 * by JSON References ($ref).
 *
 * @param {string} url
 * @param {object|string|undefined} data
 * @param {Config} config
 * @param {function} callback
 *
 * @this JsonSchemaLib
 */
function read (url, data, config, callback) {
  // Create a new JSON Schema and root file
  var schema = new Schema(config, this.plugins);
  var rootFile = new File(schema);
  schema.files.push(rootFile);

  if (url) {
    // Resolve the user-supplied URL to an absolute URL
    url = schema.plugins.resolveURL({ to: url });

    // Remove any hash from the URL, since this URL represents the WHOLE file, not a fragment of it
    rootFile.url = stripHash(url);
  }

  if (data) {
    // No need to read the file, because its data was passed-in
    rootFile.data = data;
    rootFile[__internal].state = STATE_READ;
    safeCall(parseFile, rootFile, callback);
  }
  else {
    // Read/download the file
    safeCall(readFile, rootFile, callback);
  }
}

/**
 * Reads the given file from its source (e.g. web server, filesystem, etc.)
 *
 * @param {File} file
 * @param {function} callback
 */
function readFile (file, callback) {
  var schema = file.schema;
  file[__internal].state = STATE_READING;

  if (schema.config.sync) {
    schema.plugins.readFileSync({ file: file });
    doneReading(null);
  }
  else {
    schema.plugins.readFileAsync({ file: file }, doneReading);
  }

  function doneReading (err) {
    if (err) {
      callback(err);
    }
    else {
      file[__internal].state = STATE_READ;
      safeCall(decodeFile, file, callback);
    }
  }
}

/**
 * Decodes the {@link File#data} property of the given file.
 *
 * @param {File} file
 * @param {function} callback
 */
function decodeFile (file, callback) {
  file.schema.plugins.decodeFile({ file: file });
  safeCall(parseFile, file, callback);
}

/**
 * Parses the {@link File#data} property of the given file.
 *
 * @param {File} file
 * @param {function} callback
 */
function parseFile (file, callback) {
  file.schema.plugins.parseFile({ file: file });

  // Find all JSON References ($ref) to other files, and add new File objects to the schema
  resolveFileReferences(file);

  safeCall(readReferencedFiles, file.schema, callback);
}

/**
 * Reads any files in the schema that haven't been read yet.
 *
 * @param {Schema} schema
 * @param {function} callback
 */
function readReferencedFiles (schema, callback) {
  var filesBeingRead = [], filesToRead = [];
  var file, i;

  // Check the state of all files in the schema
  for (i = 0; i < schema.files.length; i++) {
    file = schema.files[i];

    if (file[__internal].state < STATE_READING) {
      filesToRead.push(file);
    }
    else if (file[__internal].state < STATE_READ) {
      filesBeingRead.push(file);
    }
  }

  // Have we finished reading everything?
  if (filesToRead.length === 0 && filesBeingRead.length === 0) {
    return safeCall(finished, schema, callback);
  }

  // In sync mode, just read the next file.
  // In async mode, start reading all files in the queue
  var numberOfFilesToRead = schema.config.sync ? 1 : filesToRead.length;

  for (i = 0; i < numberOfFilesToRead; i++) {
    file = filesToRead[i];
    safeCall(readFile, file, callback);
  }
}

/**
 * Performs final cleanup steps on the schema after all files have been read successfully.
 *
 * @param {Schema} schema
 * @param {function} callback
 */
function finished (schema, callback) {
  schema.plugins.finished();
  delete schema.config.sync;
  callback(null, schema);
}

},{"../../util/internal":27,"../../util/safeCall":31,"../../util/stripHash":33,"../File":2,"../Schema":15,"./resolveFileReferences":7}],7:[function(require,module,exports){
'use strict';

var File = require('../File');
var typeOf = require('../../util/typeOf');
var stripHash = require('../../util/stripHash');

module.exports = resolveFileReferences;

/**
 * Resolves all JSON References ($ref) to other files, and adds new {@link File} objects
 * to the schema as needed.
 *
 * @param {File} file - The file to search for JSON References
 */
function resolveFileReferences (file) {
  // Start crawling at the root of the file
  crawl(file.data, file);
}

/**
 * Recursively crawls the given value, and resolves any external JSON References.
 *
 * @param {*} obj - The value to crawl. If it's not an object or array, it will be ignored.
 * @param {File} file - The file that the value is part of
 */
function crawl (obj, file) {
  var type = typeOf(obj);

  if (!type.isPOJO && !type.isArray) {
    return;
  }

  if (type.isPOJO && isFileReference(obj)) {
    // We found a file reference, so resolve it
    resolveFileReference(obj.$ref, file);
  }

  // Crawl this POJO or Array, looking for nested JSON References
  //
  // NOTE: According to the spec, JSON References should not have any properties other than "$ref".
  //       However, in practice, many schema authors DO add additional properties. Because of this,
  //       we crawl JSON Reference objects just like normal POJOs. If the schema author has added
  //       additional properties, then they have opted-into this non-spec-compliant behavior.
  var keys = Object.keys(obj);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = obj[key];
    crawl(value, file);
  }
}

/**
 * Determines whether the given value is a JSON Reference that points to a file
 * (as opposed to an internal reference, which points to a location within its own file).
 *
 * @param {*} value - The value to inspect
 * @returns {boolean}
 */
function isFileReference (value) {
  return typeof value.$ref === 'string' && value.$ref[0] !== '#';
}

/**
 * Resolves the given JSON Reference URL against the specified file, and adds a new {@link File}
 * object to the schema if necessary.
 *
 * @param {string} url - The JSON Reference URL (may be absolute or relative)
 * @param {File} file - The file that the JSON Reference is in
 */
function resolveFileReference (url, file) {
  var schema = file.schema;
  var newFile = new File(schema);

  // Remove any hash from the URL, since this URL represents the WHOLE file, not a fragment of it
  url = stripHash(url);

  // Resolve the new file's absolute URL
  newFile.url = schema.plugins.resolveURL({ from: file.url, to: url });

  // Add this file to the schema, unless it already exists
  if (!schema.files.exists(newFile)) {
    schema.files.push(newFile);
  }
}

},{"../../util/stripHash":33,"../../util/typeOf":34,"../File":2}],8:[function(require,module,exports){
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

},{"../../util/assign":25,"../../util/internal":27,"./callAsyncPlugin":9,"./callSyncPlugin":10,"./validatePlugins":13,"ono":37}],9:[function(require,module,exports){
'use strict';

var ono = require('ono');
var __internal = require('../../util/internal');
var safeCall = require('../../util/safeCall');
var filterByMethod = require('./filterByMethod');

module.exports = callAsyncPlugin;

/**
 * Calls an asynchronous plugin method with the given arguments.
 *
 * @param {PluginHelper} pluginHelper - The {@link PluginHelper} whose plugins are called
 * @param {string} methodName - The name of the plugin method to call
 * @param {object} args - The arguments to pass to the method
 * @param {function} callback - The callback to call when the method finishes
 */
function callAsyncPlugin (pluginHelper, methodName, args, callback) {
  var plugins = pluginHelper.filter(filterByMethod(methodName));
  args.schema = pluginHelper[__internal].schema;
  args.config = args.schema.config;

  safeCall(callNextPlugin, plugins, methodName, args, callback);
}

/**
 * Calls the the next plugin from an array of plugins.
 *
 * @param {object[]} plugins - The array of plugins
 * @param {string} methodName - The name of the plugin method to call
 * @param {object} args - The arguments to pass to the method
 * @param {function} callback - The callback to call if the plugin returns a result or throws an error
 */
function callNextPlugin (plugins, methodName, args, callback) {
  var nextCalled;
  var plugin = plugins.shift();
  var Promise = args.config.Promise;

  if (!plugin) {
    // We've reached the end of the plugin chain. No plugin returned a value.
    callback(null, { plugin: null, result: undefined });
  }

  // Invoke the plugin method. It can return a value, return a Promise, throw an error, or call next()
  args.next = next;
  var returnValue = plugin[methodName].call(null, args);

  if (returnValue !== undefined) {
    Promise.resolve(returnValue).then(function (result) {
      var err;
      if (nextCalled) {
        err = ono('Error in %s.%s: Cannot return a value and call next()', plugin.name, methodName);
      }
      done(err, result);
    });
  }

  function next (err, result) {
    if (nextCalled) {
      err = ono('Error in %s.%s: next() was called multiple times', plugin.name, methodName);
    }

    nextCalled = true;
    done(err, result);
  }

  function done (err, result) {
    if (err) {
      callback(ono(err, 'Error in %s.%s:', plugin.name, methodName));
    }
    else if (nextCalled && result === undefined) {
      safeCall(callNextPlugin, plugins, methodName, args, callback);
    }
    else {
      // next() was NOT called, so return the plugin's result (even if there was no return value)
      callback(null, { plugin: plugin, result: result });
    }
  }
}

},{"../../util/internal":27,"../../util/safeCall":31,"./filterByMethod":11,"ono":37}],10:[function(require,module,exports){
'use strict';

var ono = require('ono');
var __internal = require('../../util/internal');
var filterByMethod = require('./filterByMethod');

module.exports = callSyncPlugin;

/**
 * Calls a synchronous plugin method with the given arguments.
 *
 * @param {PluginHelper} pluginHelper - The {@link PluginHelper} whose plugins are called
 * @param {string} methodName - The name of the plugin method to call
 * @param {object} args - The arguments to pass to the method
 *
 * @returns {{ result: *, plugin: ?object }}
 * If the method was handled by a plugin (i.e. the plugin didn't call next()), then the returned
 * object will contain a reference to the plugin, and the result that was returned by the plugin.
 */
function callSyncPlugin (pluginHelper, methodName, args) {
  var plugins = pluginHelper.filter(filterByMethod(methodName));
  args.schema = pluginHelper[__internal].schema;
  args.config = args.schema.config;

  return callNextPlugin(plugins, methodName, args);
}

/**
 * Calls the the next plugin from an array of plugins.
 *
 * @param {object[]} plugins - The array of plugins
 * @param {string} methodName - The name of the plugin method to call
 * @param {object} args - The arguments to pass to the method
 * @returns {{ plugin: ?object, result: * }}
 */
function callNextPlugin (plugins, methodName, args) {
  var result, error, nextCalled;
  var plugin = plugins.shift();

  if (!plugin) {
    // We've reached the end of the plugin chain. No plugin returned a value.
    return { plugin: null, result: undefined };
  }

  // Invoke the plugin method. It can return a value, throw an error, or call next()
  args.next = next;
  result = plugin[methodName].call(null, args);

  if (result !== undefined && nextCalled) {
    throw ono('Error in %s.%s: Cannot return a value and call next()', plugin.name, methodName);
  }

  if (error) {
    throw ono(error, 'Error in %s.%s:', plugin.name, methodName);
  }
  else if (nextCalled && result === undefined) {
    return callNextPlugin(plugins, methodName, args);
  }
  else {
    // next() was NOT called, so return the plugin's result (even if there was no return value)
    return { plugin: plugin, result: result };
  }

  function next (err, value) {
    if (nextCalled) {
      error = ono('Error in %s.%s: next() was called multiple times', plugin.name, methodName);
    }

    nextCalled = true;
    error = err;
    result = value;
  }
}

},{"../../util/internal":27,"./filterByMethod":11,"ono":37}],11:[function(require,module,exports){
'use strict';

module.exports = filterByMethod;

/**
 * Used to filter plugins that implement the specified method.
 *
 * @param {string} methodName
 * @returns {function}
 */
function filterByMethod (methodName) {
  return function methodFilter (plugin) {
    return typeof plugin[methodName] === 'function';
  };
}

},{}],12:[function(require,module,exports){
'use strict';

var ono = require('ono');
var typeOf = require('../../util/typeOf');

module.exports = validatePlugin;

/**
 * Ensures that a user-supplied value is a valid plugin POJO.
 * An error is thrown if the value is invalid.
 *
 * @param {*} plugin - The user-supplied value to validate
 */
function validatePlugin (plugin) {
  var type = typeOf(plugin);

  if (!type.isPOJO) {
    throw ono('Invalid arguments. Expected a plugin object.');
  }
}

},{"../../util/typeOf":34,"ono":37}],13:[function(require,module,exports){
'use strict';

var ono = require('ono');
var typeOf = require('../../util/typeOf');
var validatePlugin = require('./validatePlugin');

module.exports = validatePlugins;

/**
 * Ensures that a user-supplied value is a valid array of plugins.
 * An error is thrown if the value is invalid.
 *
 * @param {*} plugins - The user-supplied value to validate
 */
function validatePlugins (plugins) {
  var type = typeOf(plugins);

  if (type.hasValue) {
    if (type.isArray) {
      // Make sure all the items in the array are valid plugins
      plugins.forEach(validatePlugin);
    }
    else {
      throw ono('Invalid arguments. Expected an array of plugins.');
    }
  }
}

},{"../../util/typeOf":34,"./validatePlugin":12,"ono":37}],14:[function(require,module,exports){
'use strict';

var ono = require('ono');
var typeOf = require('../util/typeOf');
var assign = require('../util/assign');
var deepAssign = require('../util/deepAssign');
var validatePlugin = require('./PluginHelper/validatePlugin');
var validatePlugins = require('./PluginHelper/validatePlugins');

module.exports = PluginManager;

/**
 * Manages the plugins that are used by a {@link JsonSchemaLib} instance.
 *
 * @param {object[]} [plugins] - The initial plugins to load
 *
 * @class
 * @extends Array
 */
function PluginManager (plugins) {
  validatePlugins(plugins);
  plugins = plugins || PluginManager.defaults;

  // Clone the plugins, so that multiple JsonSchemaLib instances can safely use the same plugins
  var pluginManager = plugins.map(clonePlugin);

  // Return an array that "inherits" from PluginManager
  return assign(pluginManager, PluginManager.prototype);
}

/**
 * The default plugins that are used if no plugins are specified.
 *
 * NOTE: The default plugins differ for Node.js and web browsers.
 *
 * @type {object[]}
 */
PluginManager.defaults = [];

/**
 * Adds a plugin to this {@link PluginManager} instance.
 *
 * @param {object} plugin - A plugin object
 * @param {number} [priority] - Optionaly override the plugin's default priority.
 * @private
 */
PluginManager.prototype.use = function use (plugin, priority) {
  validatePlugin(plugin);
  validatePriority(priority);

  // Clone the plugin, so that multiple JsonSchemaLib instances can safely use the same plugin
  plugin = clonePlugin(plugin);
  plugin.priority = priority || plugin.priority;

  this.push(plugin);
};

/**
 * Ensures that a user-supplied value is a valid plugin priority.
 * An error is thrown if the value is invalid.
 *
 * @param {*} priority - The user-supplied value to validate
 */
function validatePriority (priority) {
  var type = typeOf(priority);

  if (type.hasValue && !type.isNumber) {
    throw ono('Invalid arguments. Expected a priority number.');
  }
}

/**
 * Returns a deep clone of the given plugin.
 *
 * @param {object} plugin
 * @returns {object}
 */
function clonePlugin (plugin) {
  var clone = {};
  return deepAssign(clone, plugin);
}

},{"../util/assign":25,"../util/deepAssign":26,"../util/typeOf":34,"./PluginHelper/validatePlugin":12,"./PluginHelper/validatePlugins":13,"ono":37}],15:[function(require,module,exports){
'use strict';

var Config = require('./Config');
var PluginHelper = require('./PluginHelper/PluginHelper');
var FileArray = require('./FileArray');

module.exports = Schema;

/**
 * This class represents the entire JSON Schema. It contains information about all the files in the
 * schema, and provides methods to traverse the schema and get/set values within it using
 * JSON Pointers.
 *
 * @param {Config|object} [config] - The config settings that apply to the schema
 * @param {object[]} [plugins] - The plugins to use for the schema
 *
 * @class
 */
function Schema (config, plugins) {
  /**
   * The config settings that apply to this schema.
   *
   * @type {Config}
   */
  this.config = new Config(config);

  /**
   * The plugins to use for this schema.
   *
   * @type {PluginHelper}
   */
  this.plugins = new PluginHelper(plugins, this);

  /**
   * All of the files in the schema, including the main schema file itself
   *
   * @type {File[]}
   * @readonly
   */
  this.files = new FileArray(this);
}

Object.defineProperties(Schema.prototype, {
  /**
   * The parsed JSON Schema.
   *
   * @type {object|null}
   */
  root: {
    configurable: true,
    enumerable: true,
    get: function () {
      if (this.files.length === 0) {
        return null;
      }
      return this.files[0].data;
    }
  },

  /**
   * The URL of the main JSON Schema file.
   *
   * @type {string|null}
   */
  rootURL: {
    configurable: true,
    enumerable: true,
    get: function () {
      if (this.files.length === 0) {
        return null;
      }
      return this.files[0].url;
    }
  },

  /**
   * The main JSON Schema file.
   *
   * @type {File}
   */
  rootFile: {
    configurable: true,
    enumerable: true,
    get: function () {
      return this.files[0] || null;
    }
  },
});

/**
 * Returns a human-friendly representation of the Schema object.
 *
 * @returns {string}
 */
Schema.prototype.toString = function () {
  var rootFile = this.rootFile;
  if (rootFile) {
    return rootFile.toString();
  }
  else {
    return '(empty JSON schema)';
  }
};

/**
 * Determines whether a given value exists in the schema.
 *
 * @param {string} pointer - A JSON Pointer that points to the value to check.
 *                           Or a URL with a url-encoded JSON Pointer in the hash.
 *
 * @returns {boolean}      - Returns true if the value exists, or false otherwise
 */
Schema.prototype.exists = function (pointer) {                                                            // eslint-disable-line no-unused-vars
  // TODO: pointer can be a JSON Pointer (starting with a /) or a URL
};

/**
 * Finds a value in the schema.
 *
 * @param {string} pointer - A JSON Pointer that points to the value to get.
 *                           Or a URL with a url-encoded JSON Pointer in the hash.
 *
 * @returns {*}            - Returns the specified value, which can be ANY JavaScript type, including
 *                           an object, array, string, number, null, undefined, NaN, etc.
 *                           If the value is not found, then an error is thrown.
 */
Schema.prototype.get = function (pointer) {                                                               // eslint-disable-line no-unused-vars
  // TODO: pointer can be a JSON Pointer (starting with a /) or a URL
};

/**
 * Sets a value in the schema.
 *
 * @param {string} pointer - A JSON Pointer that points to the value to set.
 *                           Or a URL with a url-encoded JSON Pointer in the hash.
 *
 * @param {*}      value   - The value to assign. This can be ANY JavaScript type, including
 *                           an object, array, string, number, null, undefined, NaN, etc.
 */
Schema.prototype.set = function (pointer, value) {                                                        // eslint-disable-line no-unused-vars
  // TODO: pointer can be a JSON Pointer (starting with a /) or a URL
};

},{"./Config":1,"./FileArray":3,"./PluginHelper/PluginHelper":8}],16:[function(require,module,exports){
'use strict';

var PluginManager = require('./api/PluginManager');

// Default plugins for web browsers
PluginManager.defaults.push(
  require('./plugins/BrowserUrlPlugin'),
  require('./plugins/XMLHttpRequestPlugin'),
  require('./plugins/TextDecoderPlugin'),
  require('./plugins/ArrayDecoderPlugin'),
  require('./plugins/JsonPlugin')
);

module.exports = require('./exports');

},{"./api/PluginManager":14,"./exports":17,"./plugins/ArrayDecoderPlugin":18,"./plugins/BrowserUrlPlugin":19,"./plugins/JsonPlugin":20,"./plugins/TextDecoderPlugin":21,"./plugins/XMLHttpRequestPlugin":22}],17:[function(require,module,exports){
'use strict';

var JsonSchemaLib = require('./api/JsonSchemaLib/JsonSchemaLib');
var Schema = require('./api/Schema');
var File = require('./api/File');

/**
 * The default instance of {@link JsonSchemaLib}
 *
 * @type {JsonSchemaLib}
 */
module.exports = createJsonSchemaLib();

// Bind the "read" methods of the default instance, so they can be used as standalone functions
module.exports.read = JsonSchemaLib.prototype.read.bind(module.exports);
module.exports.readAsync = JsonSchemaLib.prototype.readAsync.bind(module.exports);
module.exports.readSync = JsonSchemaLib.prototype.readSync.bind(module.exports);

/**
 * Allows ES6 default import syntax (for Babel, TypeScript, etc.)
 *
 * @type {JsonSchemaLib}
 */
module.exports.default = module.exports;

/**
 * Factory function for creating new instances of {@link JsonSchemaLib}
 */
module.exports.create = createJsonSchemaLib;

/**
 * Utility methods for plugin developers
 */
module.exports.util = {
  /**
   * Determines whether the given value is a {@link Schema} object
   *
   * @param {*} value
   * @returns {boolean}
   */
  isSchema: function isSchema (value) {
    return value instanceof Schema;
  },

  /**
   * Determines whether the given value is a {@link File} object
   *
   * @param {*} value
   * @returns {boolean}
   */
  isFile: function isFile (value) {
    return value instanceof File;
  },
};

/**
 * Creates an instance of JsonSchemaLib
 *
 * @param {Config} [config] - The configuration to use. Can be overridden by {@link JsonSchemaLib#read}
 * @param {object[]} [plugins] - The plugins to use. Additional plugins can be added via {@link JsonSchemaLib#use}
 * @returns {JsonSchemaLib}
 */
function createJsonSchemaLib (config, plugins) {
  return new JsonSchemaLib(config, plugins);
}

},{"./api/File":2,"./api/JsonSchemaLib/JsonSchemaLib":4,"./api/Schema":15}],18:[function(require,module,exports){
'use strict';

var isTypedArray = require('../util/isTypedArray');

/**
 * This plugin decodes arrays of bytes (such as TypedArrays or ArrayBuffers) to strings, if possible.
 */
module.exports = {
  name: 'ArrayDecoderPlugin',

  /**
   * This plugin has a lower priority than the BufferDecoderPlugin or TextDecoderPlugin, so it will only be used
   * as a final fallback if neither of the other decoders is able to decode the file's data.
   */
  priority: 5,

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

    if (file.encoding && (isTypedArray(file.data) || Array.isArray(file.data))) {
      try {
        // Normalize the data to 2-byte characters
        var characterArray = new Uint16Array(file.data);

        // Convert the characters to a string
        var string = String.fromCharCode.apply(null, characterArray);

        // Remove the byte order mark, if any
        return stripBOM(string);
      }
      catch (err) {
        // Unknown encoding, so just call the next decoder plugin
        next();
      }
    }
    else {
      // The file data is not a supported data type, so call the next decoder plugin
      next();
    }
  },
};

/**
 * Removes the UTF-16 byte order mark, if any, from a string.
 *
 * @param {string} str
 * @returns {string}
 */
function stripBOM (str) {
  var bom = str.charCodeAt(0);

  // Check for the UTF-16 byte order mark (0xFEFF or 0xFFFE)
  if (bom === 0xFEFF || bom === 0xFFFE) {
    return str.slice(1);
  }

  return str;
}

},{"../util/isTypedArray":28}],19:[function(require,module,exports){
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

},{"../util/stripHash":33}],20:[function(require,module,exports){
'use strict';

// Matches "application/json", "text/json", "application/hal+json", etc.
var mimeTypePattern = /[/+]json$/;

// Matches any URL that ends with ".json" (ignoring the query and hash)
var extensionPattern = /^[^\?\#]+\.json(\?.*)?$/;

/**
 * This plugin parses JSON files
 */
module.exports = {
  name: 'JsonPlugin',

  /**
   * This plugin has a low priority, to allow for higher-priority third-party parser plugins.
   *
   * NOTE: Priorities 0 - 99 are reserved for JsonSchemaLib.
   *       Third-party plugins should have priorities of 100 or greater.
   */
  priority: 20,

  /**
   * Parses the given file's data, in place.
   *
   * @param {File} args.file - The {@link File} to parse.
   * @param {function} args.next - Calls the next plugin, if the file data cannot be parsed
   * @returns {*}
   */
  parseFile: function parseFile (args) {
    var file = args.file;
    var next = args.next;

    try {
      // Optimistically try to parse the file as JSON.
      return JSON.parse(file.data);
    }
    catch (error) {
      if (isJsonFile(file)) {
        // This is a JSON file, but its contents are invalid
        throw error;
      }
      else {
        // This probably isn't a JSON file, so call the next parser plugin
        next();
      }
    }
  },
};

/**
 * Determines whether the file data is JSON
 *
 * @param {File} file
 * @returns {boolean}
 */
function isJsonFile (file) {
  return file.data &&                             // The file has data
    (typeof file.data === 'string') &&            // and it's a string
    (
      mimeTypePattern.test(file.mimeType) ||      // and it has a JSON MIME type
      extensionPattern.test(file.url)             // or at least a .json file extension
    );
}

},{}],21:[function(require,module,exports){
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

},{"../util/isTypedArray":28}],22:[function(require,module,exports){
'use strict';

var ono = require('ono');
var setHttpMetadata = require('../util/setHttpMetadata');
var safeCall = require('../util/safeCall');

/**
 * This plugin enables downlaoding files via the browser's XMLHttpRequest API.
 */
module.exports = {
  name: 'XMLHttpRequestPlugin',

  /**
   * This plugin's priority is the same as the HttpPlugin's priority, for consistency between the
   * Node.js and web browser functionality.
   */
  priority: 5,

  /**
   * Synchronously downlaods a file.
   *
   * @param {File} args.file - The {@link File} to read
   * @param {function} args.next - Calls the next plugin, if the file is not a local filesystem file
   */
  readFileSync: function readFileSync (args) {
    var file = args.file;
    var config = args.config;
    var error, response;

    safeCall(sendRequest, false, file.url, config, function handleResponse (err, res) {
      error = err;
      response = res;
    });

    if (error) {
      throw error;
    }
    else {
      setHttpMetadata(file, response);
      return response.data;
    }
  },

  /**
   * Asynchronously downlaods a file.
   *
   * @param {File} args.file - The {@link File} to read
   * @param {function} args.next - Calls the next plugin, if the file is not a local filesystem file
   */
  readFileAsync: function readFileAsync (args) {
    var file = args.file;
    var config = args.config;
    var next = args.next;

    safeCall(sendRequest, false, file.url, config, function handleResponse (err, res) {
      if (err) {
        next(err);
      }
      else {
        setHttpMetadata(file, res);
        next(null, res.data);
      }
    });
  },

};

/**
 * Sends an HTTP GET request using XMLHttpRequest.
 *
 * @param {boolean} async - Whether to send the request synchronously or asynchronously
 * @param {string} url - The absolute URL to request
 * @param {Config} config - Configuration settings, such as timeout, headers, etc.
 * @param {function} callback - Called with an error or response object
 */
function sendRequest (async, url, config, callback) {
  var req = new XMLHttpRequest();
  req.open('GET', url, async);

  req.onerror = handleError;
  req.ontimeout = handleError;
  req.onload = handleResponse;

  setXHRConfig(req, config);

  req.send();

  function handleResponse () {
    var res = {
      status: getResponseStatus(req.status, url),
      headers: parseResponseHeaders(req.getAllResponseHeaders()),
      data: req.response || req.responseText,
    };

    if (res.status >= 200 && res.status < 300) {
      callback(null, res);
    }
    else if (res.status < 200 || res.status < 400) {
      callback(ono('Invalid/unsupported HTTP %d response', res.status));
    }
    else {
      callback(ono('HTTP %d error occurred (%s)', res.status, req.statusText));
    }
  }

  function handleError (err) {
    callback(err);
  }
}

/**
 * Sets the XMLHttpRequest properties, per the specified configuration.
 *
 * @param {XMLHttpRequest} req
 * @param {Config} config
 */
function setXHRConfig (req, config) {
  try {
    req.withCredentials = config.http.withCredentials;
  }
  catch (err) {
    // Some browsers don't allow `withCredentials` to be set for synchronous requests
  }

  try {
    req.timeout = config.http.timeout;
  }
  catch (err) {
    // Some browsers don't allow `timeout` to be set for synchronous requests
  }

  // Set request headers
  Object.keys(config.http.headers).forEach(function (key) {
    var value = config.http.headers[key];
    if (value !== undefined) {
      req.setRequestHeader(key, value);
    }
  });
}

/**
 * Returns the HTTP response status, accounting for certain edge cases
 *
 * @param {number} status - The {@link XMLHttpRequest#status} property
 * @param {string} url - The URL that was requested
 * @returns {number}
 */
function getResponseStatus (status, url) {
  if (status === 1223) {
    // IE9 returns 1223 instead of 204
    // https://stackoverflow.com/questions/10046972/msie-returns-status-code-of-1223-for-ajax-request
    return 204;
  }
  else if (status) {
    return status;
  }
  else if (url.substr(0, 5) === 'file:') {
    // file:// protocol doesn't use response codes, so emulate a 200 response
    return 200;
  }
  else {
    // No status. Probably a network error.
    return 0;
  }
}

/**
 * Parses HTTP response headers, and returns them as an object with header names as keys
 * and header values as values.
 *
 * @param {?string} headers - Response headers, separated by CRLF
 * @returns {object}
 */
function parseResponseHeaders (headers) {
  var parsed = {};

  if (headers) {
    headers.split('\n').forEach(function (line) {
      var separatorIndex = line.indexOf(':');
      var key = line.substr(0, separatorIndex).trim().toLowerCase();
      var value = line.substr(separatorIndex + 1).trim().toLowerCase();

      if (key) {
        parsed[key] = value;
      }
    });
  }

  return parsed;
}

},{"../util/safeCall":31,"../util/setHttpMetadata":32,"ono":37}],23:[function(require,module,exports){
'use strict';

var ono = require('ono');

if (typeof Promise === 'function') {
  module.exports = Promise;
}
else {
  module.exports = function PromiseNotSupported () {
    throw ono('This browser does not support Promises. Please use a callback instead.');
  };
}

},{"ono":37}],24:[function(require,module,exports){
'use strict';

if (typeof Symbol === 'function') {
  module.exports = Symbol;
}
else {
  module.exports = function (name) {
    return name;
  };
}

},{}],25:[function(require,module,exports){
'use strict';

module.exports = Object.assign || assign;

/**
 * Assigns the properties of the source object to the target object
 *
 * @param {object} target
 * @param {object} source
 */
function assign (target, source) {
  var keys = Object.keys(source);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    target[key] = source[key];
  }

  return target;
}

},{}],26:[function(require,module,exports){
'use strict';

var typeOf = require('./typeOf');

module.exports = deepAssign;

/**
 * Deeply assigns the properties of the source object to the target object
 *
 * @param {object} target
 * @param {object} source
 */
function deepAssign (target, source) {
  var keys = Object.keys(source);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var oldValue = target[key];
    var newValue = source[key];

    target[key] = deepClone(newValue, oldValue);
  }

  return target;
}

/**
 * Returns a deep clone of the given value
 *
 * @param {*} value
 * @param {*} oldValue
 * @returns {*}
 */
function deepClone (value, oldValue) {
  var type = typeOf(value);
  var clone;

  if (type.isPOJO) {
    var oldType = typeOf(oldValue);
    if (oldType.isPOJO) {
      // Return a merged clone of the old POJO and the new POJO
      clone = deepAssign({}, oldValue);
      return deepAssign(clone, value);
    }
    else {
      return deepAssign({}, value);
    }
  }
  else if (type.isArray) {
    clone = [];
    for (var i = 0; i < value.length; i++) {
      clone.push(deepClone(value[i]));
    }
  }
  else if (type.hasValue) {
    // string, boolean, number, function, Date, RegExp, etc.
    // Just return it as-is
    return value;
  }
}

},{"./typeOf":34}],27:[function(require,module,exports){
'use strict';

var Symbol = require('./Symbol');

/**
 * This Symbol is used for internal state that should not be accessesed outside of this library.
 *
 * @type {Symbol}
 */
module.exports = Symbol('__internal');

},{"./Symbol":24}],28:[function(require,module,exports){
'use strict';

var supportedDataTypes = getSupportedDataTypes();

module.exports = isTypedArray;

/**
 * Determines whether the given object is any of the TypedArray types.
 *
 * @param {*} obj
 * @returns {boolean}
 */
function isTypedArray (obj) {
  if (typeof obj === 'object') {
    for (var i = 0; i < supportedDataTypes.length; i++) {
      if (obj instanceof supportedDataTypes[i]) {
        return true;
      }
    }
  }
}

/**
 * Returns the TypedArray data types that are supported by the current runtime environment.
 *
 * @returns {function[]}
 */
function getSupportedDataTypes () {
  var types = [];

  // NOTE: More frequently-used types come first, to improve lookup speed
  if (typeof Uint8Array === 'function') {
    types.push(Uint8Array);
  }
  if (typeof Uint16Array === 'function') {
    types.push(Uint16Array);
  }
  if (typeof ArrayBuffer === 'function') {
    types.push(ArrayBuffer);
  }
  if (typeof Uint32Array === 'function') {
    types.push(Uint32Array);
  }
  if (typeof Int8Array === 'function') {
    types.push(Int8Array);
  }
  if (typeof Int16Array === 'function') {
    types.push(Int16Array);
  }
  if (typeof Int32Array === 'function') {
    types.push(Int32Array);
  }
  if (typeof Uint8ClampedArray === 'function') {
    types.push(Uint8ClampedArray);
  }
  if (typeof Float32Array === 'function') {
    types.push(Float32Array);
  }
  if (typeof Float64Array === 'function') {
    types.push(Float64Array);
  }
  if (typeof DataView === 'function') {
    types.push(DataView);
  }

  return types;
}

},{}],29:[function(require,module,exports){
'use strict';

module.exports = lowercase;

/**
 * Returns the given string in lowercase, or null if the value is not a string.
 *
 * @param {*} str
 * @returns {string|null}
 */
function lowercase (str) {
  if (str && typeof str === 'string') {
    return str.toLowerCase();
  }
  else {
    return null;
  }
}

},{}],30:[function(require,module,exports){
'use strict';

module.exports = omit;

/**
 * Returns an object containing all properties of the given object,
 * except for the specified properties to be omitted.
 *
 * @param {object} obj
 * @param {...string} props
 * @returns {object}
 */
function omit (obj, props) {
  props = Array.prototype.slice.call(arguments, 1);
  var keys = Object.keys(obj);
  var newObj = {};

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];

    if (props.indexOf(key) === -1) {
      newObj[key] = obj[key];
    }
  }

  return newObj;
}

},{}],31:[function(require,module,exports){
'use strict';

module.exports = safeCall;

var ono = require('ono');

/**
 * Calls the specified function with the given arguments, ensuring that the callback
 * is only called once, and that it's called even if an unhandled error occurs.
 *
 * @param {function} fn - The function to call
 * @param {...*} [args] - The arguments to pass to the function
 * @param {function} callback - The callback function
 */
function safeCall (fn, args, callback) {
  args = Array.prototype.slice.call(arguments, 1);
  callback = args.pop();
  var callbackCalled;

  try {
    args.push(safeCallback);
    fn.apply(null, args);
  }
  catch (err) {
    if (callbackCalled) {
      throw err;
    }
    else {
      safeCallback(err);
    }
  }

  function safeCallback (err, result) {
    if (callbackCalled) {
      err = ono('Error in %s: callback was called multiple times', fn.name);
    }

    callbackCalled = true;
    callback(err, result);
  }
}

},{"ono":37}],32:[function(require,module,exports){
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

},{"../util/lowercase":29,"content-type":35}],33:[function(require,module,exports){
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

},{}],34:[function(require,module,exports){
'use strict';

module.exports = typeOf;

/**
 * Returns information about the type of the given value
 *
 * @param {*} value
 * @returns {{ hasValue: boolean, isArray: boolean, isPOJO: boolean, isNumber: boolean }}
 */
function typeOf (value) {
  var type = {
    hasValue: false,
    isArray: false,
    isPOJO: false,
    isNumber: false,
  };

  if (value !== undefined && value !== null) {
    type.hasValue = true;
    var typeName = typeof value;

    if (typeName === 'number') {
      type.isNumber = !isNaN(value);
    }
    else if (Array.isArray(value)) {
      type.isArray = true;
    }
    else {
      type.isPOJO =
        (typeName === 'object') &&
        !(value instanceof RegExp) &&
        !(value instanceof Date);
    }
  }

  return type;
}

},{}],35:[function(require,module,exports){
/*!
 * content-type
 * Copyright(c) 2015 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * RegExp to match *( ";" parameter ) in RFC 7231 sec 3.1.1.1
 *
 * parameter     = token "=" ( token / quoted-string )
 * token         = 1*tchar
 * tchar         = "!" / "#" / "$" / "%" / "&" / "'" / "*"
 *               / "+" / "-" / "." / "^" / "_" / "`" / "|" / "~"
 *               / DIGIT / ALPHA
 *               ; any VCHAR, except delimiters
 * quoted-string = DQUOTE *( qdtext / quoted-pair ) DQUOTE
 * qdtext        = HTAB / SP / %x21 / %x23-5B / %x5D-7E / obs-text
 * obs-text      = %x80-FF
 * quoted-pair   = "\" ( HTAB / SP / VCHAR / obs-text )
 */
var paramRegExp = /; *([!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+) *= *("(?:[\u000b\u0020\u0021\u0023-\u005b\u005d-\u007e\u0080-\u00ff]|\\[\u000b\u0020-\u00ff])*"|[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+) */g
var textRegExp = /^[\u000b\u0020-\u007e\u0080-\u00ff]+$/
var tokenRegExp = /^[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+$/

/**
 * RegExp to match quoted-pair in RFC 7230 sec 3.2.6
 *
 * quoted-pair = "\" ( HTAB / SP / VCHAR / obs-text )
 * obs-text    = %x80-FF
 */
var qescRegExp = /\\([\u000b\u0020-\u00ff])/g

/**
 * RegExp to match chars that must be quoted-pair in RFC 7230 sec 3.2.6
 */
var quoteRegExp = /([\\"])/g

/**
 * RegExp to match type in RFC 6838
 *
 * media-type = type "/" subtype
 * type       = token
 * subtype    = token
 */
var typeRegExp = /^[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+\/[!#$%&'\*\+\-\.\^_`\|~0-9A-Za-z]+$/

/**
 * Module exports.
 * @public
 */

exports.format = format
exports.parse = parse

/**
 * Format object to media type.
 *
 * @param {object} obj
 * @return {string}
 * @public
 */

function format(obj) {
  if (!obj || typeof obj !== 'object') {
    throw new TypeError('argument obj is required')
  }

  var parameters = obj.parameters
  var type = obj.type

  if (!type || !typeRegExp.test(type)) {
    throw new TypeError('invalid type')
  }

  var string = type

  // append parameters
  if (parameters && typeof parameters === 'object') {
    var param
    var params = Object.keys(parameters).sort()

    for (var i = 0; i < params.length; i++) {
      param = params[i]

      if (!tokenRegExp.test(param)) {
        throw new TypeError('invalid parameter name')
      }

      string += '; ' + param + '=' + qstring(parameters[param])
    }
  }

  return string
}

/**
 * Parse media type to object.
 *
 * @param {string|object} string
 * @return {Object}
 * @public
 */

function parse(string) {
  if (!string) {
    throw new TypeError('argument string is required')
  }

  if (typeof string === 'object') {
    // support req/res-like objects as argument
    string = getcontenttype(string)

    if (typeof string !== 'string') {
      throw new TypeError('content-type header is missing from object');
    }
  }

  if (typeof string !== 'string') {
    throw new TypeError('argument string is required to be a string')
  }

  var index = string.indexOf(';')
  var type = index !== -1
    ? string.substr(0, index).trim()
    : string.trim()

  if (!typeRegExp.test(type)) {
    throw new TypeError('invalid media type')
  }

  var key
  var match
  var obj = new ContentType(type.toLowerCase())
  var value

  paramRegExp.lastIndex = index

  while (match = paramRegExp.exec(string)) {
    if (match.index !== index) {
      throw new TypeError('invalid parameter format')
    }

    index += match[0].length
    key = match[1].toLowerCase()
    value = match[2]

    if (value[0] === '"') {
      // remove quotes and escapes
      value = value
        .substr(1, value.length - 2)
        .replace(qescRegExp, '$1')
    }

    obj.parameters[key] = value
  }

  if (index !== -1 && index !== string.length) {
    throw new TypeError('invalid parameter format')
  }

  return obj
}

/**
 * Get content-type from req/res objects.
 *
 * @param {object}
 * @return {Object}
 * @private
 */

function getcontenttype(obj) {
  if (typeof obj.getHeader === 'function') {
    // res-like
    return obj.getHeader('content-type')
  }

  if (typeof obj.headers === 'object') {
    // req-like
    return obj.headers && obj.headers['content-type']
  }
}

/**
 * Quote a string if necessary.
 *
 * @param {string} val
 * @return {string}
 * @private
 */

function qstring(val) {
  var str = String(val)

  // no need to quote tokens
  if (tokenRegExp.test(str)) {
    return str
  }

  if (str.length > 0 && !textRegExp.test(str)) {
    throw new TypeError('invalid parameter value')
  }

  return '"' + str.replace(quoteRegExp, '\\$1') + '"'
}

/**
 * Class to represent a content type.
 * @private
 */
function ContentType(type) {
  this.parameters = Object.create(null)
  this.type = type
}

},{}],36:[function(require,module,exports){
function format(fmt) {
  var re = /(%?)(%([jds]))/g
    , args = Array.prototype.slice.call(arguments, 1);
  if(args.length) {
    fmt = fmt.replace(re, function(match, escaped, ptn, flag) {
      var arg = args.shift();
      switch(flag) {
        case 's':
          arg = '' + arg;
          break;
        case 'd':
          arg = Number(arg);
          break;
        case 'j':
          arg = JSON.stringify(arg);
          break;
      }
      if(!escaped) {
        return arg; 
      }
      args.unshift(arg);
      return match;
    })
  }

  // arguments remain after formatting
  if(args.length) {
    fmt += ' ' + args.join(' ');
  }

  // update escaped %% values
  fmt = fmt.replace(/%{2,2}/g, '%');

  return '' + fmt;
}

module.exports = format;

},{}],37:[function(require,module,exports){
'use strict';

var format = require('format-util');
var slice = Array.prototype.slice;
var protectedProperties = ['name', 'message', 'stack'];
var errorPrototypeProperties = [
  'name', 'message', 'description', 'number', 'code', 'fileName', 'lineNumber', 'columnNumber',
  'sourceURL', 'line', 'column', 'stack'
];

module.exports = create(Error);
module.exports.error = create(Error);
module.exports.eval = create(EvalError);
module.exports.range = create(RangeError);
module.exports.reference = create(ReferenceError);
module.exports.syntax = create(SyntaxError);
module.exports.type = create(TypeError);
module.exports.uri = create(URIError);
module.exports.formatter = format;

/**
 * Creates a new {@link ono} function that creates the given Error class.
 *
 * @param {Class} Klass - The Error subclass to create
 * @returns {ono}
 */
function create (Klass) {
  /**
   * @param {Error}   [err]     - The original error, if any
   * @param {object}  [props]   - An object whose properties will be added to the error object
   * @param {string}  [message] - The error message. May contain {@link util#format} placeholders
   * @param {...*}    [params]  - Parameters that map to the `message` placeholders
   * @returns {Error}
   */
  return function onoFactory (err, props, message, params) {   // eslint-disable-line no-unused-vars
    var formatArgs = [];
    var formattedMessage = '';

    // Determine which arguments were actually specified
    if (typeof err === 'string') {
      formatArgs = slice.call(arguments);
      err = props = undefined;
    }
    else if (typeof props === 'string') {
      formatArgs = slice.call(arguments, 1);
      props = undefined;
    }
    else if (typeof message === 'string') {
      formatArgs = slice.call(arguments, 2);
    }

    // If there are any format arguments, then format the error message
    if (formatArgs.length > 0) {
      formattedMessage = module.exports.formatter.apply(null, formatArgs);
    }

    if (err && err.message) {
      // The inner-error's message will be added to the new message
      formattedMessage += (formattedMessage ? ' \n' : '') + err.message;
    }

    // Create the new error
    // NOTE: DON'T move this to a separate function! We don't want to pollute the stack trace
    var newError = new Klass(formattedMessage);

    // Extend the new error with the additional properties
    extendError(newError, err);   // Copy properties of the original error
    extendToJSON(newError);       // Replace the original toJSON method
    extend(newError, props);      // Copy custom properties, possibly including a custom toJSON method

    return newError;
  };
}

/**
 * Extends the targetError with the properties of the source error.
 *
 * @param {Error}   targetError - The error object to extend
 * @param {?Error}  sourceError - The source error object, if any
 */
function extendError (targetError, sourceError) {
  extendStack(targetError, sourceError);
  extend(targetError, sourceError);
}

/**
 * JavaScript engines differ in how errors are serialized to JSON - especially when it comes
 * to custom error properties and stack traces.  So we add our own toJSON method that ALWAYS
 * outputs every property of the error.
 */
function extendToJSON (error) {
  error.toJSON = errorToJSON;

  // Also add an inspect() method, for compatibility with Node.js' `util.inspect()` method
  error.inspect = errorToString;
}

/**
 * Extends the target object with the properties of the source object.
 *
 * @param {object}  target - The object to extend
 * @param {?source} source - The object whose properties are copied
 */
function extend (target, source) {
  if (source && typeof source === 'object') {
    var keys = Object.keys(source);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];

      // Don't copy "protected" properties, since they have special meaning/behavior
      // and are set by the onoFactory function
      if (protectedProperties.indexOf(key) >= 0) {
        continue;
      }

      try {
        target[key] = source[key];
      }
      catch (e) {
        // This property is read-only, so it can't be copied
      }
    }
  }
}

/**
 * Custom JSON serializer for Error objects.
 * Returns all built-in error properties, as well as extended properties.
 *
 * @returns {object}
 */
function errorToJSON () {
  var json = {};

  // Get all the properties of this error
  var keys = Object.keys(this);

  // Also include properties from the Error prototype
  keys = keys.concat(errorPrototypeProperties);

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var value = this[key];
    var type = typeof value;
    if (type !== 'undefined' && type !== 'function') {
      json[key] = value;
    }
  }

  return json;
}

/**
 * Serializes Error objects as human-readable JSON strings for debugging/logging purposes.
 *
 * @returns {string}
 */
function errorToString () {
  return JSON.stringify(this, null, 2).replace(/\\n/g, '\n');
}

/**
 * Extend the error stack to include its cause
 *
 * @param {Error} targetError
 * @param {Error} sourceError
 */
function extendStack (targetError, sourceError) {
  if (hasLazyStack(targetError)) {
    if (sourceError) {
      lazyJoinStacks(targetError, sourceError);
    }
    else {
      lazyPopStack(targetError);
    }
  }
  else {
    if (sourceError) {
      targetError.stack = joinStacks(targetError.stack, sourceError.stack);
    }
    else {
      targetError.stack = popStack(targetError.stack);
    }
  }
}

/**
 * Appends the original {@link Error#stack} property to the new Error's stack.
 *
 * @param {string} newStack
 * @param {string} originalStack
 * @returns {string}
 */
function joinStacks (newStack, originalStack) {
  newStack = popStack(newStack);

  if (newStack && originalStack) {
    return newStack + '\n\n' + originalStack;
  }
  else {
    return newStack || originalStack;
  }
}

/**
 * Removes Ono from the stack, so that the stack starts at the original error location
 *
 * @param {string} stack
 * @returns {string}
 */
function popStack (stack) {
  if (stack) {
    var lines = stack.split('\n');

    if (lines.length < 2) {
      // The stack only has one line, so there's nothing we can remove
      return stack;
    }

    // Find the `onoFactory` call in the stack, and remove it
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (line.indexOf('onoFactory') >= 0) {
        lines.splice(i, 1);
        return lines.join('\n');
      }
    }

    // If we get here, then the stack doesn't contain a call to `onoFactory`.
    // This may be due to minification or some optimization of the JS engine.
    // So just return the stack as-is.
    return stack;
  }
}

/**
 * Does a one-time determination of whether this JavaScript engine
 * supports lazy `Error.stack` properties.
 */
var supportsLazyStack = (function () {
  return !!(
    // ES5 property descriptors must be supported
    Object.getOwnPropertyDescriptor && Object.defineProperty &&

    // Chrome on Android doesn't support lazy stacks :(
    (typeof navigator === 'undefined' || !/Android/.test(navigator.userAgent))
  );
}());

/**
 * Does this error have a lazy stack property?
 *
 * @param {Error} err
 * @returns {boolean}
 */
function hasLazyStack (err) {
  if (!supportsLazyStack) {
    return false;
  }

  var descriptor = Object.getOwnPropertyDescriptor(err, 'stack');
  if (!descriptor) {
    return false;
  }
  return typeof descriptor.get === 'function';
}

/**
 * Calls {@link joinStacks} lazily, when the {@link Error#stack} property is accessed.
 *
 * @param {Error} targetError
 * @param {Error} sourceError
 */
function lazyJoinStacks (targetError, sourceError) {
  var targetStack = Object.getOwnPropertyDescriptor(targetError, 'stack');

  Object.defineProperty(targetError, 'stack', {
    get: function () {
      return joinStacks(targetStack.get.apply(targetError), sourceError.stack);
    },
    enumerable: false,
    configurable: true
  });
}

/**
 * Calls {@link popStack} lazily, when the {@link Error#stack} property is accessed.
 *
 * @param {Error} error
 */
function lazyPopStack (error) {
  var targetStack = Object.getOwnPropertyDescriptor(error, 'stack');

  Object.defineProperty(error, 'stack', {
    get: function () {
      return popStack(targetStack.get.apply(error));
    },
    enumerable: false,
    configurable: true
  });
}

},{"format-util":36}]},{},[16])(16)
});
//# sourceMappingURL=json-schema-lib.js.map
