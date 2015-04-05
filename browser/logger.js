'use strict';

// TODO: See if this can be shimmed down more
//var logLevel = require('../lib/config').getConfig().logLevel;
var logLevel = 'info';

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
        console.info.apply(this, arguments);
    };

    loggerInstance.debug = function() {
        if (LOG_LEVELS[logLevel] > LOG_LEVELS.debug) return;
        arguments[0] = '['+filename+'] ' + arguments[0];
        console.info.apply(this, arguments);
    };

    loggerInstance.info = function() {
        if (LOG_LEVELS[logLevel] > LOG_LEVELS.info) return;
        arguments[0] = '['+filename+'] ' + arguments[0];
        console.info.apply(this, arguments);
    };

    loggerInstance.warn = function() {
        if (LOG_LEVELS[logLevel] > LOG_LEVELS.warn) return;
        arguments[0] = '['+filename+'] ' + arguments[0];
        console.log.apply(this, arguments);
    };

    loggerInstance.error = function() {
        if (LOG_LEVELS[logLevel] > LOG_LEVELS.error) return;
        arguments[0] = '['+filename+'] ' + arguments[0];
        console.error.apply(this, arguments);
    };

    return loggerInstance;
};
