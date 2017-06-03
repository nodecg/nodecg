'use strict';

const configHelper = require('./config');

let Logger;
if (configHelper.config.sentry.enabled) {
	Logger = require('@nodecg/logger')(configHelper.config.logging, require('raven'));
} else {
	Logger = require('@nodecg/logger')(configHelper.config.logging);
}

module.exports = function (name) {
	return new Logger(name);
};
