'use strict';

var Symbol = require('./Symbol');

/**
 * This Symbol is used for internal state that should not be accessesed outside of this library.
 *
 * @type {Symbol}
 */
module.exports = Symbol('__internal');
