'use strict';

const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const cfgPath = argv.cfgPath || path.join(process.env.NODECG_ROOT, 'cfg/nodecg.json');
const loadConfig = require('./loader');
module.exports = loadConfig(cfgPath);
