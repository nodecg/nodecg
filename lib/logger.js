'use strict';

const configHelper = require('./config');
const Logger = require('@nodecg/logger')(configHelper.config.logging);

module.exports = function (name) {
	return new Logger(name);
};
