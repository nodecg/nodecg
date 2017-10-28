'use strict';

// Native
const fs = require('fs.extra');
const path = require('path');

// Packages
const argv = require('minimist')(process.argv.slice(2));

const cfgFilePath = argv.cfgPath || path.join(process.env.NODECG_ROOT, 'cfg/nodecg.json');
const cfgDirectoryPath = path.parse(cfgFilePath).dir;

// Make 'cfg' folder if it doesn't exist
if (!fs.existsSync(cfgDirectoryPath)) {
	fs.mkdirpSync(cfgDirectoryPath);
}

const loadConfig = require('./loader');
module.exports = loadConfig(cfgFilePath);
