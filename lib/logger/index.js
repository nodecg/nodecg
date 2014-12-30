'use strict';

var config = require('../config').getConfig(),
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

module.exports = function(filename) {
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
