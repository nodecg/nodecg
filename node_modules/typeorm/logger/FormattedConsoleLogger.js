"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormattedConsoleLogger = void 0;
const PlatformTools_1 = require("../platform/PlatformTools");
const AbstractLogger_1 = require("./AbstractLogger");
/**
 * Performs logging of the events in TypeORM.
 * This version of logger uses console to log events, syntax highlighting and formatting.
 */
class FormattedConsoleLogger extends AbstractLogger_1.AbstractLogger {
    /**
     * Write log to specific output.
     */
    writeLog(level, logMessage, queryRunner) {
        const messages = this.prepareLogMessages(logMessage, {
            highlightSql: true,
            formatSql: true,
        }, queryRunner);
        for (let message of messages) {
            switch (message.type ?? level) {
                case "log":
                case "schema-build":
                case "migration":
                    PlatformTools_1.PlatformTools.log(String(message.message));
                    break;
                case "info":
                case "query":
                    if (message.prefix) {
                        PlatformTools_1.PlatformTools.logInfo(message.prefix, message.message);
                    }
                    else {
                        PlatformTools_1.PlatformTools.log(String(message.message));
                    }
                    break;
                case "warn":
                case "query-slow":
                    if (message.prefix) {
                        PlatformTools_1.PlatformTools.logWarn(message.prefix, message.message);
                    }
                    else {
                        console.warn(PlatformTools_1.PlatformTools.warn(String(message.message)));
                    }
                    break;
                case "error":
                case "query-error":
                    if (message.prefix) {
                        PlatformTools_1.PlatformTools.logError(message.prefix, String(message.message));
                    }
                    else {
                        console.error(PlatformTools_1.PlatformTools.error(String(message.message)));
                    }
                    break;
            }
        }
    }
}
exports.FormattedConsoleLogger = FormattedConsoleLogger;

//# sourceMappingURL=FormattedConsoleLogger.js.map
