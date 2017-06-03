/* eslint-env browser */
'use strict';

let Logger;
if (window.ncgConfig.sentry.enabled) {
	Logger = require('@nodecg/logger')(window.ncgConfig.logging, window.Raven);
} else {
	Logger = require('@nodecg/logger')(window.ncgConfig.logging);
}

module.exports = function (name) {
	return new Logger(name);
};
