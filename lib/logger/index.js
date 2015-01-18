'use strict';

var configHelper = require('../config'),
    config = configHelper.getConfig(),
    _baseDir = configHelper.getBaseDirectory(),
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
    var pathToLogs = path.resolve(_baseDir, config.logging.file.path);

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

logger._trace = logger.trace;
logger._debug = logger.debug;
logger._info = logger.info;
logger._warn = logger.warn;
logger._error = logger.error;

module.exports = function(filename) {
    logger.trace = function() {
        arguments[0] = '['+filename+'] ' + arguments[0];
        logger._trace.apply(this, arguments);
    };

    logger.debug = function() {
        arguments[0] = '['+filename+'] ' + arguments[0];
        logger._debug.apply(this, arguments);
    };

    logger.info = function() {
        arguments[0] = '['+filename+'] ' + arguments[0];
        logger._info.apply(this, arguments);
    };

    logger.warn = function() {
        arguments[0] = '['+filename+'] ' + arguments[0];
        logger._warn.apply(this, arguments);
    };

    logger.error = function() {
        arguments[0] = '['+filename+'] ' + arguments[0];
        logger._error.apply(this, arguments);
    };

    return logger;
};
