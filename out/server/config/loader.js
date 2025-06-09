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
exports.loadConfig = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const cosmiconfig_1 = require("cosmiconfig");
const json_1 = require("klona/json");
const nodecg_config_schema_1 = require("../../types/nodecg-config-schema");
const loadConfig = (cfgDirOrFile) => {
    let isFile = false;
    try {
        isFile = fs.lstatSync(cfgDirOrFile).isFile();
    }
    catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
    const cfgDir = isFile ? path.dirname(cfgDirOrFile) : cfgDirOrFile;
    const cc = (0, cosmiconfig_1.cosmiconfigSync)("nodecg", {
        searchPlaces: isFile
            ? [path.basename(cfgDirOrFile)]
            : [
                "nodecg.json",
                "nodecg.yaml",
                "nodecg.yml",
                "nodecg.js",
                "nodecg.config.js",
            ],
        stopDir: cfgDir,
    });
    const result = cc.search(cfgDir);
    const userCfg = result?.config ?? {};
    if (userCfg?.bundles?.enabled && userCfg?.bundles?.disabled) {
        throw new Error("nodecg.json may only contain EITHER bundles.enabled OR bundles.disabled, not both.");
    }
    else if (!userCfg) {
        console.info("[nodecg] No config found, using defaults.");
    }
    const parseResult = nodecg_config_schema_1.nodecgConfigSchema.safeParse(userCfg);
    if (!parseResult.success) {
        console.error("[nodecg] Config invalid:", parseResult.error.errors[0]?.message);
        throw new Error(parseResult.error.errors[0]?.message);
    }
    const config = parseResult.data;
    // Create the filtered config
    const filteredConfig = {
        host: config.host,
        port: config.port,
        baseURL: config.baseURL,
        logging: {
            console: {
                enabled: config.logging.console.enabled,
                level: config.logging.console.level,
                timestamps: config.logging.console.timestamps,
                replicants: config.logging.console.replicants,
            },
            file: {
                enabled: config.logging.file.enabled,
                level: config.logging.file.level,
                timestamps: config.logging.file.timestamps,
                replicants: config.logging.file.replicants,
            },
        },
        login: {
            enabled: config.login.enabled,
        },
        sentry: {
            enabled: config.sentry.enabled,
            dsn: config.sentry.enabled ? config.sentry.dsn : undefined,
        },
    };
    if (config.login.enabled && config.login.steam) {
        filteredConfig.login.steam = {
            enabled: config.login.steam.enabled,
        };
    }
    if (config.login.enabled && config.login.twitch) {
        filteredConfig.login.twitch = {
            enabled: config.login.twitch.enabled,
            clientID: config.login.twitch.enabled
                ? config.login.twitch.clientID
                : undefined,
            scope: config.login.twitch.enabled
                ? config.login.twitch.scope
                : undefined,
        };
    }
    if (config.login.enabled && config.login.local) {
        filteredConfig.login.local = {
            enabled: config.login.local.enabled,
        };
    }
    if (config.login.enabled && config.login.discord) {
        filteredConfig.login.discord = {
            enabled: config.login.discord.enabled,
            clientID: config.login.discord.enabled
                ? config.login.discord.clientID
                : undefined,
            scope: config.login.discord.enabled
                ? config.login.discord.scope
                : undefined,
        };
    }
    if (config.ssl) {
        filteredConfig.ssl = {
            enabled: config.ssl.enabled,
        };
    }
    return {
        config: (0, json_1.klona)(config),
        filteredConfig: (0, json_1.klona)(filteredConfig),
    };
};
exports.loadConfig = loadConfig;
//# sourceMappingURL=loader.js.map