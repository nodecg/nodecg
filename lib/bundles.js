'use strict';

const Logger = require('./logger');
const nodecgVersion = require('../package.json').version;
const config = require('./config').config;
const bundleManager = require('@nodecg/bundle-manager')(process.cwd(), nodecgVersion, config, Logger);

module.exports = bundleManager;
