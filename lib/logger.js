'use strict';

const configHelper = require('./config');

let Logger;
if (configHelper.config.rollbar.enabled) {
	Logger = require('@nodecg/logger')(configHelper.config.logging, require('rollbar'));
} else {
	Logger = require('@nodecg/logger')(configHelper.config.logging);
}

module.exports = function (name) {
	return new Logger(name);
};
