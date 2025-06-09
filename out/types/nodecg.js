"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCG = void 0;
var NodeCG;
(function (NodeCG) {
    /**
     * The logging levels available to NodeCG.
     */
    let LogLevel;
    (function (LogLevel) {
        LogLevel["Trace"] = "verbose";
        LogLevel["Debug"] = "debug";
        LogLevel["Info"] = "info";
        LogLevel["Warn"] = "warn";
        LogLevel["Error"] = "error";
        LogLevel["Silent"] = "silent";
    })(LogLevel = NodeCG.LogLevel || (NodeCG.LogLevel = {}));
})(NodeCG || (exports.NodeCG = NodeCG = {}));
//# sourceMappingURL=nodecg.js.map