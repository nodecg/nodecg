/* eslint-env browser */
'use strict';

let Logger;
if (window.ncgConfig.rollbar.enabled) {
	Logger = require('@nodecg/logger')(window.ncgConfig.logging, window.Rollbar);
} else {
	Logger = require('@nodecg/logger')(window.ncgConfig.logging);
}

module.exports = function (name) {
	return new Logger(name);
};
