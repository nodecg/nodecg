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
