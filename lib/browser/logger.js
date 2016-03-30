/* eslint-env browser */
'use strict';

const Logger = require('@nodecg/logger')(window.ncgConfig.logging);

module.exports = function (name) {
	return new Logger(name);
};
