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
exports.parseBundle = void 0;
const node_path_1 = __importDefault(require("node:path"));
const E = __importStar(require("fp-ts/Either"));
const function_1 = require("fp-ts/function");
const IOE = __importStar(require("fp-ts/IOEither"));
const O = __importStar(require("fp-ts/Option"));
const read_json_file_sync_1 = require("../util-fp/read-json-file-sync");
const assets_1 = require("./assets");
const config_1 = require("./config");
const extension_1 = require("./extension");
const git_1 = require("./git");
const graphics_1 = require("./graphics");
const manifest_1 = require("./manifest");
const mounts_1 = require("./mounts");
const panels_1 = require("./panels");
const sounds_1 = require("./sounds");
const readBundlePackageJson = (bundlePath) => (0, function_1.pipe)(bundlePath, (bundlePath) => node_path_1.default.join(bundlePath, "package.json"), read_json_file_sync_1.readJsonFileSync, IOE.map((json) => json), IOE.mapLeft((error) => {
    if (error.code === "ENOENT") {
        return new Error(`Bundle at path ${bundlePath} does not contain a package.json!`);
    }
    if (error instanceof SyntaxError) {
        return new Error(`${bundlePath}'s package.json is not valid JSON, please check it against a validator such as jsonlint.com`);
    }
    return error;
}));
const parseBundleNodecgConfig = (0, function_1.flow)((bundlePath) => node_path_1.default.join(bundlePath, "nodecg.config.js"), IOE.tryCatchK(require, E.toError), IOE.match(() => ({}), (config) => config.default || config), IOE.fromIO, IOE.flatMap((config) => {
    if (typeof config !== "object" ||
        config === null ||
        Array.isArray(config)) {
        return IOE.left(new Error("nodecg.config.js must export an object"));
    }
    return IOE.right(config);
}));
const parseBundle = (bundlePath, bundleCfg) => {
    const manifest = (0, function_1.pipe)(bundlePath, readBundlePackageJson, IOE.flatMap((0, manifest_1.parseManifest)(bundlePath)), IOE.getOrElse((error) => {
        throw error;
    }))();
    const dashboardDir = node_path_1.default.resolve(bundlePath, "dashboard");
    const graphicsDir = node_path_1.default.resolve(bundlePath, "graphics");
    const nodecgBundleConfig = (0, function_1.pipe)(parseBundleNodecgConfig(bundlePath), IOE.getOrElse((error) => {
        throw error;
    }))();
    const config = (0, function_1.pipe)(bundleCfg, O.fromNullable, O.match(() => (0, config_1.parseDefaults)(manifest.name)(bundlePath), IOE.tryCatchK((bundleCfg) => (0, config_1.parseBundleConfig)(manifest.name, bundlePath, bundleCfg), E.toError)), IOE.getOrElse((error) => {
        throw error;
    }))();
    const bundle = {
        ...manifest,
        dir: bundlePath,
        config,
        dashboard: {
            dir: dashboardDir,
            panels: (0, panels_1.parsePanels)(dashboardDir, manifest),
        },
        mount: (0, mounts_1.parseMounts)(manifest),
        graphics: (0, graphics_1.parseGraphics)(graphicsDir, manifest),
        assetCategories: (0, assets_1.parseAssets)(manifest),
        hasExtension: (0, extension_1.parseExtension)(bundlePath, manifest),
        git: (0, git_1.parseGit)(bundlePath),
        ...(0, sounds_1.parseSounds)(bundlePath, manifest),
        nodecgBundleConfig,
    };
    return bundle;
};
exports.parseBundle = parseBundle;
//# sourceMappingURL=index.js.map