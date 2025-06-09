"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BundleManager = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const internal_util_1 = require("@nodecg/internal-util");
const chokidar_1 = __importDefault(require("chokidar"));
const cosmiconfig_1 = require("cosmiconfig");
const lodash_1 = require("lodash");
const semver_1 = __importDefault(require("semver"));
const typed_emitter_1 = require("../shared/typed-emitter");
const bundle_parser_1 = require("./bundle-parser");
const git_1 = require("./bundle-parser/git");
const logger_1 = require("./logger");
const is_child_path_1 = require("./util/is-child-path");
/**
 * Milliseconds
 */
const READY_WAIT_THRESHOLD = 1000;
// Start up the watcher, but don't watch any files yet.
// We'll add the files we want to watch later, in the init() method.
const watcher = chokidar_1.default.watch([], {
    persistent: true,
    ignoreInitial: true,
    followSymlinks: true,
    ignored: [
        /\/.+___jb_.+___/, // Ignore temp files created by JetBrains IDEs
        /\/node_modules\//, // Ignore node_modules folders
        /\/bower_components\//, // Ignore bower_components folders
        /\/.+\.lock/, // Ignore lockfiles
    ],
});
const blacklistedBundleDirectories = ["node_modules", "bower_components"];
const bundles = [];
const log = (0, logger_1.createLogger)("bundle-manager");
const hasChanged = new Set();
let backoffTimer;
class BundleManager extends typed_emitter_1.TypedEmitter {
    bundles = [];
    get ready() {
        return this._ready;
    }
    _ready = false;
    _cfgPath;
    _debouncedGitChangeHandler = (0, lodash_1.debounce)((bundleName) => {
        const bundle = this.find(bundleName);
        if (!bundle) {
            return;
        }
        bundle.git = (0, git_1.parseGit)(bundle.dir);
        this.emit("gitChanged", bundle);
    }, 250);
    constructor(bundlesPaths, cfgPath, nodecgVersion, nodecgConfig) {
        super();
        this._cfgPath = cfgPath;
        const readyTimeout = setTimeout(() => {
            this._ready = true;
            this.emit("ready");
        }, READY_WAIT_THRESHOLD);
        bundlesPaths.forEach((bundlesPath) => {
            log.trace(`Loading bundles from ${bundlesPath}`);
            /* istanbul ignore next */
            watcher.on("add", (filePath) => {
                const bundleName = getParentProjectName(filePath, bundlesPath);
                if (!bundleName) {
                    return;
                }
                // In theory, the bundle parser would have thrown an error long before this block would execute,
                // because in order for us to be adding a panel HTML file, that means that the file would have been missing,
                // which the parser does not allow and would throw an error for.
                // Just in case though, its here.
                if (this.isPanelHTMLFile(bundleName, filePath)) {
                    this.handleChange(bundleName);
                }
                else if (isGitData(bundleName, filePath)) {
                    this._debouncedGitChangeHandler(bundleName);
                }
                if (!this.ready) {
                    readyTimeout.refresh();
                }
            });
            watcher.on("change", (filePath) => {
                const bundleName = getParentProjectName(filePath, bundlesPath);
                if (!bundleName) {
                    return;
                }
                if (isManifest(bundleName, filePath) ||
                    this.isPanelHTMLFile(bundleName, filePath)) {
                    this.handleChange(bundleName);
                }
                else if (isGitData(bundleName, filePath)) {
                    this._debouncedGitChangeHandler(bundleName);
                }
            });
            watcher.on("unlink", (filePath) => {
                const bundleName = getParentProjectName(filePath, bundlesPath);
                if (!bundleName) {
                    return;
                }
                if (this.isPanelHTMLFile(bundleName, filePath)) {
                    // This will cause NodeCG to crash, because the parser will throw an error due to
                    // a panel's HTML file no longer being present.
                    this.handleChange(bundleName);
                }
                else if (isGitData(bundleName, filePath)) {
                    this._debouncedGitChangeHandler(bundleName);
                }
            });
            /* istanbul ignore next */
            watcher.on("error", (error) => {
                log.error(error.stack);
            });
            const handleBundle = (bundlePath) => {
                if (!node_fs_1.default.statSync(bundlePath).isDirectory()) {
                    return;
                }
                // Prevent attempting to load unwanted directories. Those specified above and all dot-prefixed.
                const bundleFolderName = node_path_1.default.basename(bundlePath);
                if (blacklistedBundleDirectories.includes(bundleFolderName) ||
                    bundleFolderName.startsWith(".")) {
                    return;
                }
                const bundlePackageJson = node_fs_1.default.readFileSync(node_path_1.default.join(bundlePath, "package.json"), "utf-8");
                const bundleName = JSON.parse(bundlePackageJson).name;
                if (nodecgConfig?.["bundles"]?.disabled?.includes(bundleName)) {
                    log.debug(`Not loading bundle ${bundleName} as it is disabled in config`);
                    return;
                }
                if (nodecgConfig?.["bundles"]?.enabled &&
                    !nodecgConfig?.["bundles"].enabled.includes(bundleName)) {
                    log.debug(`Not loading bundle ${bundleName} as it is not enabled in config`);
                    return;
                }
                log.debug(`Loading bundle ${bundleName}`);
                // Parse each bundle and push the result onto the bundles array
                const bundle = (0, bundle_parser_1.parseBundle)(bundlePath, loadBundleCfg(cfgPath, bundleName));
                if (internal_util_1.isLegacyProject) {
                    if (!bundle.compatibleRange) {
                        log.error(`${bundle.name}'s package.json does not have a "nodecg.compatibleRange" property.`);
                        return;
                    }
                    // Check if the bundle is compatible with this version of NodeCG
                    if (!semver_1.default.satisfies(nodecgVersion, bundle.compatibleRange)) {
                        log.error(`${bundle.name} requires NodeCG version ${bundle.compatibleRange}, current version is ${nodecgVersion}`);
                        return;
                    }
                }
                bundles.push(bundle);
                // Use `chokidar` to watch for file changes within bundles.
                // Workaround for https://github.com/paulmillr/chokidar/issues/419
                // This workaround is necessary to fully support symlinks.
                // This is applied after the bundle has been validated and loaded.
                // Bundles that do not properly load upon startup are not recognized for updates.
                watcher.add([
                    node_path_1.default.join(bundlePath, ".git"), // Watch `.git` directories.
                    node_path_1.default.join(bundlePath, "dashboard"), // Watch `dashboard` directories.
                    node_path_1.default.join(bundlePath, "package.json"), // Watch each bundle's `package.json`.
                ]);
            };
            if (!internal_util_1.isLegacyProject) {
                handleBundle(internal_util_1.rootPath);
            }
            if (node_fs_1.default.existsSync(bundlesPath)) {
                const bundleFolders = node_fs_1.default.readdirSync(bundlesPath);
                bundleFolders.forEach((bundleFolderName) => {
                    const bundlePath = node_path_1.default.join(bundlesPath, bundleFolderName);
                    handleBundle(bundlePath);
                });
            }
        });
    }
    /**
     * Returns a shallow-cloned array of all currently active bundles.
     * @returns {Array.<Object>}
     */
    all() {
        return bundles.slice(0);
    }
    /**
     * Returns the bundle with the given name. undefined if not found.
     * @param name {String} - The name of the bundle to find.
     * @returns {Object|undefined}
     */
    find(name) {
        return bundles.find((b) => b.name === name);
    }
    /**
     * Adds a bundle to the internal list, replacing any existing bundle with the same name.
     * @param bundle {Object}
     */
    add(bundle) {
        /* istanbul ignore if: Again, it shouldn't be possible for "bundle" to be undefined, but just in case... */
        if (!bundle) {
            return;
        }
        // Remove any existing bundles with this name
        if (this.find(bundle.name)) {
            this.remove(bundle.name);
        }
        bundles.push(bundle);
    }
    /**
     * Removes a bundle with the given name from the internal list. Does nothing if no match found.
     * @param bundleName {String}
     */
    remove(bundleName) {
        const len = bundles.length;
        for (let i = 0; i < len; i++) {
            // TODO: this check shouldn't have to happen, idk why things in this array can sometimes be undefined
            if (!bundles[i]) {
                continue;
            }
            if (bundles[i].name === bundleName) {
                bundles.splice(i, 1);
            }
        }
    }
    handleChange(bundleName) {
        setTimeout(() => {
            this._handleChange(bundleName);
        }, 100);
    }
    /**
     * Resets the backoff timer used to avoid event thrashing when many files change rapidly.
     */
    resetBackoffTimer() {
        clearTimeout(backoffTimer); // Typedefs for clearTimeout are always wonky
        backoffTimer = setTimeout(() => {
            backoffTimer = undefined;
            for (const bundleName of hasChanged) {
                log.debug("Backoff finished, emitting change event for", bundleName);
                this.handleChange(bundleName);
            }
            hasChanged.clear();
        }, 500);
    }
    /**
     * Checks if a given path is a panel HTML file of a given bundle.
     * @param bundleName {String}
     * @param filePath {String}
     * @returns {Boolean}
     * @private
     */
    isPanelHTMLFile(bundleName, filePath) {
        const bundle = this.find(bundleName);
        if (bundle) {
            return bundle.dashboard.panels.some((panel) => panel.path.endsWith(filePath));
        }
        return false;
    }
    /**
     * Only used by tests.
     */
    _stopWatching() {
        void watcher.close();
    }
    _handleChange(bundleName) {
        const bundle = this.find(bundleName);
        /* istanbul ignore if: It's rare for `bundle` to be undefined here, but it can happen when using black/whitelisting. */
        if (!bundle) {
            return;
        }
        if (backoffTimer) {
            log.debug("Backoff active, delaying processing of change detected in", bundleName);
            hasChanged.add(bundleName);
            this.resetBackoffTimer();
        }
        else {
            log.debug("Processing change event for", bundleName);
            this.resetBackoffTimer();
            try {
                const reparsedBundle = (0, bundle_parser_1.parseBundle)(bundle.dir, loadBundleCfg(this._cfgPath, bundle.name));
                this.add(reparsedBundle);
                this.emit("bundleChanged", reparsedBundle);
            }
            catch (error) {
                log.warn('Unable to handle the bundle "%s" change:\n%s', bundleName, error.stack);
                this.emit("invalidBundle", bundle, error);
            }
        }
    }
}
exports.BundleManager = BundleManager;
/**
 * Checks if a given path is the manifest file for a given bundle.
 * @param bundleName {String}
 * @param filePath {String}
 * @returns {Boolean}
 * @private
 */
function isManifest(bundleName, filePath) {
    return (node_path_1.default.dirname(filePath).endsWith(bundleName) &&
        node_path_1.default.basename(filePath) === "package.json");
}
/**
 * Checks if a given path is in the .git dir of a bundle.
 * @param bundleName {String}
 * @param filePath {String}
 * @returns {Boolean}
 * @private
 */
function isGitData(bundleName, filePath) {
    const regex = new RegExp(`${bundleName}\\${node_path_1.default.sep}\\.git`);
    return regex.test(filePath);
}
/**
 * Determines which config file to use for a bundle.
 */
function loadBundleCfg(cfgDir, bundleName) {
    try {
        const cc = (0, cosmiconfig_1.cosmiconfigSync)("nodecg", {
            searchPlaces: [
                `${bundleName}.json`,
                `${bundleName}.yaml`,
                `${bundleName}.yml`,
                `${bundleName}.js`,
                `${bundleName}.config.js`,
            ],
            stopDir: cfgDir,
        });
        const result = cc.search(cfgDir);
        return result?.config;
    }
    catch (_) {
        throw new Error(`Config for bundle "${bundleName}" could not be read. Ensure that it is valid JSON, YAML, or CommonJS.`);
    }
}
function getParentProjectName(changePath, rootPath) {
    if (!(0, is_child_path_1.isChildPath)(rootPath, changePath)) {
        return false;
    }
    const filePath = node_path_1.default.join(changePath, "package.json");
    try {
        const fileContent = node_fs_1.default.readFileSync(filePath, "utf-8");
        try {
            const parsed = JSON.parse(fileContent);
            return parsed.name;
        }
        catch (error) {
            return false;
        }
    }
    catch (error) {
        const parentDir = node_path_1.default.join(changePath, "..");
        if (parentDir === changePath) {
            return false;
        }
        return getParentProjectName(parentDir, rootPath);
    }
}
//# sourceMappingURL=bundle-manager.js.map