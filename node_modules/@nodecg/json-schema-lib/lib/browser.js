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
