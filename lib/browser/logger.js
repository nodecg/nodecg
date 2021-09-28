/* eslint-env browser */
/* global globalThis */
'use strict';

let Logger;
if (globalThis.ncgConfig.sentry.enabled) {
	Logger = require('../logger/browser')(globalThis.ncgConfig.logging, globalThis.Raven);
} else {
	Logger = require('../logger/browser')(globalThis.ncgConfig.logging);
}

module.exports = function (name) {
	return new Logger(name);
};
