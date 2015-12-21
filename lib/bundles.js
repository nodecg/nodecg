'use strict';

var Logger = require('./logger');
var nodecgVersion = require('../package.json').version;
var config = require('./config').config;
var bundleManager = require('@nodecg/bundle-manager')(process.cwd(), nodecgVersion, config, Logger);

module.exports = bundleManager;
