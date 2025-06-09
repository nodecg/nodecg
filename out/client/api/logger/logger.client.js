import { format, inspect } from "util";
import { LogLevel } from "../../../types/logger-interface";
const OrderedLogLevels = {
    verbose: 0,
    debug: 1,
    info: 2,
    warn: 3,
    error: 4,
    silent: 5,
};
/**
 * A factory that configures and returns a Logger constructor.
 *
 * @returns  A constructor used to create discrete logger instances.
 */
export function loggerFactory(initialOpts = {}, sentry = undefined) {
    var _a, _b, _c, _d;
    var _e;
    /**
     * Constructs a new Logger instance that prefixes all output with the given name.
     * @param name {String} - The label to prefix all output of this logger with.
     * @returns {Object} - A Logger instance.
     * @constructor
     */
    return _e = class Logger {
            constructor(name) {
                this.name = name;
                this.name = name;
            }
            trace(...args) {
                if (_e._silent) {
                    return;
                }
                if (OrderedLogLevels[_e._level] > OrderedLogLevels.verbose) {
                    return;
                }
                console.info(`[${this.name}]`, ...args);
            }
            debug(...args) {
                if (_e._silent) {
                    return;
                }
                if (OrderedLogLevels[_e._level] > OrderedLogLevels.debug) {
                    return;
                }
                console.info(`[${this.name}]`, ...args);
            }
            info(...args) {
                if (_e._silent) {
                    return;
                }
                if (OrderedLogLevels[_e._level] > OrderedLogLevels.info) {
                    return;
                }
                console.info(`[${this.name}]`, ...args);
            }
            warn(...args) {
                if (_e._silent) {
                    return;
                }
                if (OrderedLogLevels[_e._level] > OrderedLogLevels.warn) {
                    return;
                }
                console.warn(`[${this.name}]`, ...args);
            }
            error(...args) {
                if (_e._silent) {
                    return;
                }
                if (OrderedLogLevels[_e._level] > OrderedLogLevels.error) {
                    return;
                }
                console.error(`[${this.name}]`, ...args);
                if (sentry) {
                    const formattedArgs = args.map((argument) => typeof argument === "object"
                        ? inspect(argument, { depth: null, showProxy: true })
                        : argument);
                    sentry.captureException(new Error(`[${this.name}] ` +
                        format(formattedArgs[0], ...formattedArgs.slice(1))));
                }
            }
            replicants(...args) {
                if (_e._silent) {
                    return;
                }
                if (!_e._shouldLogReplicants) {
                    return;
                }
                console.info(`[${this.name}]`, ...args);
            }
        },
        // A messy bit of internal state used to determine if the special-case "replicants" logging level is active.
        _e._shouldLogReplicants = Boolean((_a = initialOpts.console) === null || _a === void 0 ? void 0 : _a.replicants),
        _e._silent = !((_b = initialOpts.console) === null || _b === void 0 ? void 0 : _b.enabled),
        _e._level = (_d = (_c = initialOpts.console) === null || _c === void 0 ? void 0 : _c.level) !== null && _d !== void 0 ? _d : LogLevel.Info,
        _e;
}
//# sourceMappingURL=logger.client.js.map