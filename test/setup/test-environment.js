'use strict';

var path = require('path');
var request = require('request');
var server = require(path.resolve(__dirname, '../../lib/server'));

module.exports = {
    server: server,
    apis: {
        view: {},
        dashboard: {},
        extension: {}
    },
    browsers: {
        view: {},
        dashboard: {}
    },
    request: request
};
