"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.sentryEnabled = exports.exitOnUncaught = exports.filteredConfig = exports.config = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const internal_util_1 = require("@nodecg/internal-util");
const yargs_1 = require("yargs");
const loader_1 = require("./loader");
const cfgDirectoryPath = yargs_1.argv["cfgPath"] ?? path.join((0, internal_util_1.getNodecgRoot)(), "cfg");
// Make 'cfg' folder if it doesn't exist
if (!fs.existsSync(cfgDirectoryPath)) {
    fs.mkdirSync(cfgDirectoryPath, { recursive: true });
}
const { config, filteredConfig } = (0, loader_1.loadConfig)(cfgDirectoryPath);
exports.config = config;
exports.filteredConfig = filteredConfig;
exports.exitOnUncaught = config.exitOnUncaught;
exports.sentryEnabled = config.sentry?.enabled;
//# sourceMappingURL=index.js.map