'use strict';

// TODO: See if this can be shimmed down more
var config = require('../lib/config').getConfig();
var logLevel = config.logging.console.level;
var logReplicants = config.logging.replicants;

var LOG_LEVELS = {
    trace: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4
};

module.exports = function(filename) {
    var loggerInstance = {};

    loggerInstance.trace = function() {
        if (LOG_LEVELS[logLevel] > LOG_LEVELS.trace) return;
        arguments[0] = '['+filename+'] ' + arguments[0];
        console.info.apply(console, arguments);
    };

    loggerInstance.debug = function() {
        if (LOG_LEVELS[logLevel] > LOG_LEVELS.debug) return;
        arguments[0] = '['+filename+'] ' + arguments[0];
        console.info.apply(console, arguments);
    };

    loggerInstance.info = function() {
        if (LOG_LEVELS[logLevel] > LOG_LEVELS.info) return;
        arguments[0] = '['+filename+'] ' + arguments[0];
        console.info.apply(console, arguments);
    };

    loggerInstance.warn = function() {
        if (LOG_LEVELS[logLevel] > LOG_LEVELS.warn) return;
        arguments[0] = '['+filename+'] ' + arguments[0];
        console.log.apply(console, arguments);
    };

    loggerInstance.error = function() {
        if (LOG_LEVELS[logLevel] > LOG_LEVELS.error) return;
        arguments[0] = '['+filename+'] ' + arguments[0];
        console.error.apply(console, arguments);
    };

    loggerInstance.replicants = function() {
        if (!logReplicants) return;
        arguments[0] = '['+filename+'] ' + arguments[0];
        console.info.apply(console, arguments);
    };

    return loggerInstance;
};
