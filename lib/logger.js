'use strict';

var configHelper = require('./config');
var Logger = require('@nodecg/logger')(configHelper.getConfig().logging);

module.exports = function(name) {
    return new Logger(name);
};
