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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SentryConfig = void 0;
const os = __importStar(require("node:os"));
const path = __importStar(require("node:path"));
const Sentry = __importStar(require("@sentry/node"));
const express_1 = __importDefault(require("express"));
const config_1 = require("../config");
const authcheck_1 = require("../util/authcheck");
const nodecg_package_json_1 = require("./nodecg-package-json");
const baseSentryConfig = {
    dsn: config_1.config.sentry.enabled ? config_1.config.sentry.dsn : "",
    serverName: os.hostname(),
    version: nodecg_package_json_1.nodecgPackageJson.version,
};
class SentryConfig {
    bundleMetadata = [];
    app = (0, express_1.default)();
    constructor(bundleManager) {
        const { app, bundleMetadata } = this;
        bundleManager.on("ready", () => {
            Sentry.configureScope((scope) => {
                bundleManager.all().forEach((bundle) => {
                    bundleMetadata.push({
                        name: bundle.name,
                        git: bundle.git,
                        version: bundle.version,
                    });
                });
                scope.setExtra("bundles", bundleMetadata);
            });
        });
        bundleManager.on("gitChanged", (bundle) => {
            const metadataToUpdate = bundleMetadata.find((data) => data.name === bundle.name);
            if (!metadataToUpdate) {
                return;
            }
            metadataToUpdate.git = bundle.git;
            metadataToUpdate.version = bundle.version;
        });
        // Render a pre-configured Sentry instance for client pages that request it.
        app.get("/sentry.js", authcheck_1.authCheck, (_req, res) => {
            res.type(".js");
            res.render(path.join(__dirname, "sentry.js.tmpl"), {
                baseSentryConfig,
                bundleMetadata,
            });
        });
    }
}
exports.SentryConfig = SentryConfig;
//# sourceMappingURL=sentry-config.js.map