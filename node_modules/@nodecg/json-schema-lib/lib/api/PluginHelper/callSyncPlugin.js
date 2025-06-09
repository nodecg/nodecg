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
