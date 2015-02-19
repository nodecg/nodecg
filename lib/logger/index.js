'use strict';

var configHelper = require('../config'),
    config = configHelper.getConfig(),
    fs = require('fs.extra'),
    path = require('path'),
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
    var pathToLogs = path.resolve(__dirname, '../..', config.logging.file.path);

    // Ensure folder exists
    if (!fs.existsSync(path.dirname(pathToLogs))) {
        fs.mkdirpSync(path.dirname(pathToLogs));
    }

    transports.push(new (winston.transports.File)({
        json: false,
        prettyPrint: true,
        filename: pathToLogs,
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

var logger = new (winston.Logger)({
    transports: transports,
    levels: {
        trace: 0,
        debug: 1,
        info: 2,
        warn: 3,
        error: 4
    }
});

module.exports = function(filename) {
    var loggerInstance = {};

    loggerInstance.trace = function() {
        arguments[0] = '['+filename+'] ' + arguments[0];
        logger.trace.apply(this, arguments);
    };

    loggerInstance.debug = function() {
        arguments[0] = '['+filename+'] ' + arguments[0];
        logger.debug.apply(this, arguments);
    };

    loggerInstance.info = function() {
        arguments[0] = '['+filename+'] ' + arguments[0];
        logger.info.apply(this, arguments);
    };

    loggerInstance.warn = function() {
        arguments[0] = '['+filename+'] ' + arguments[0];
        logger.warn.apply(this, arguments);
    };

    loggerInstance.error = function() {
        arguments[0] = '['+filename+'] ' + arguments[0];
        logger.error.apply(this, arguments);
    };

    loggerInstance.syncedVars = function() {
        if (!config.logging.syncedVars) return;
        arguments[0] = '['+filename+'] ' + arguments[0];
        logger.debug.apply(this, arguments);
    };

    return loggerInstance;
};
