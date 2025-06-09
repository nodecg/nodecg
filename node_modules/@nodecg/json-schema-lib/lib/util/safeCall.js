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
