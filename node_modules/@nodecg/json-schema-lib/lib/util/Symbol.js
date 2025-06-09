'use strict';

if (typeof Symbol === 'function') {
  module.exports = Symbol;
}
else {
  module.exports = function (name) {
    return name;
  };
}
