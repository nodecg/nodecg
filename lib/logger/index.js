'use strict';

var config = require('../config').config,
    winston = require('winston');

var transports = [];
if (config.logging.console.enabled) {
    transports.push(new (winston.transports.Console)({
        prettyPrint: true,
        colorize: true,
        level: config.logging.console.level
    }));
}

if (config.logging.file.enabled) {
    transports.push(new (winston.transports.File)({
        json: false,
        prettyPrint: true,
        filename: config.logging.file.path,
        level: config.logging.file.level
    }));
}

winston.addColors({
    trace: 'green',
    debug: 'cyan',
    info: 'white',
    warn: 'yellow',
    error: 'red'
});

module.exports = new (winston.Logger)({
    transports: transports,
    levels: {
        trace: 0,
        debug: 1,
        info: 2,
        warn: 3,
        error: 4
    }
});