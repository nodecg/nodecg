/* eslint-env browser */
'use strict';

var Logger = require('@nodecg/logger')(window.ncgConfig.logging);

module.exports = function (name) {
	return new Logger(name);
};
