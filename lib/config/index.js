'use strict';

var loadConfig = require('./loader');
var argv = require('minimist')(process.argv.slice(2));
var cfgPath = argv.cfgPath || 'cfg/nodecg.json';
module.exports = loadConfig(cfgPath);
