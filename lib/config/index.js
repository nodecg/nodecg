'use strict';

const loadConfig = require('./loader');
const argv = require('minimist')(process.argv.slice(2));
const cfgPath = argv.cfgPath || 'cfg/nodecg.json';
module.exports = loadConfig(cfgPath);
