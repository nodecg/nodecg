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
