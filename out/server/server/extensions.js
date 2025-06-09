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
exports.ExtensionManager = void 0;
const node_events_1 = require("node:events");
const path = __importStar(require("node:path"));
const Sentry = __importStar(require("@sentry/node"));
const semver_1 = __importDefault(require("semver"));
const errors_1 = require("../../shared/utils/errors");
const api_server_1 = require("../api.server");
const config_1 = require("../config");
const logger_1 = require("../logger");
const log = (0, logger_1.createLogger)("extensions");
class ExtensionManager extends node_events_1.EventEmitter {
    extensions = {};
    _satisfiedDepNames = new WeakMap();
    _ExtensionApi;
    _bundleManager;
    _apiInstances = new Set();
    constructor(io, bundleManager, replicator, mount) {
        super();
        log.trace("Starting extension mounting");
        this._bundleManager = bundleManager;
        this._ExtensionApi = (0, api_server_1.serverApiFactory)(io, replicator, this.extensions, mount);
        // Prevent us from messing with other listeners of this event
        const allBundles = bundleManager.all();
        // Track which bundles we know are fully loaded (extension and all)
        const fullyLoaded = [];
        while (allBundles.length > 0) {
            const startLen = allBundles.length;
            for (let i = 0; i < startLen; i++) {
                // If this bundle has no dependencies, load it and remove it from the list
                if (!allBundles[i].bundleDependencies) {
                    log.debug("Bundle %s has no dependencies", allBundles[i].name);
                    if (allBundles[i].hasExtension) {
                        this._loadExtension(allBundles[i]);
                    }
                    fullyLoaded.push(allBundles[i]);
                    allBundles.splice(i, 1);
                    break;
                }
                // If this bundle has dependencies, and all of them are satisfied, load it and remove it from the list
                if (this._bundleDepsSatisfied(allBundles[i], fullyLoaded)) {
                    log.debug("Bundle %s has extension with satisfied dependencies", allBundles[i].name);
                    if (allBundles[i].hasExtension) {
                        this._loadExtension(allBundles[i]);
                    }
                    fullyLoaded.push(allBundles[i]);
                    allBundles.splice(i, 1);
                    break;
                }
            }
            const endLen = allBundles.length;
            if (startLen === endLen) {
                // Any bundles left over must have had unsatisfied dependencies.
                // Print a warning about each bundle, and what its unsatisfied deps were.
                // Then, unload the bundle.
                allBundles.forEach((bundle) => {
                    const unsatisfiedDeps = [];
                    for (const dep in bundle.bundleDependencies) {
                        /* istanbul ignore if */
                        if (!{}.hasOwnProperty.call(bundle.bundleDependencies, dep)) {
                            continue;
                        }
                        /* istanbul ignore if */
                        const satisfied = this._satisfiedDepNames.get(bundle);
                        if (satisfied?.includes(dep)) {
                            continue;
                        }
                        unsatisfiedDeps.push(`${dep}@${bundle.bundleDependencies[dep]}`);
                    }
                    log.error('Bundle "%s" can not be loaded, as it has unsatisfied dependencies:\n', bundle.name, unsatisfiedDeps.join(", "));
                    bundleManager.remove(bundle.name);
                });
                log.error("%d bundle(s) can not be loaded because they have unsatisfied dependencies", endLen);
                break;
            }
        }
        log.trace("Completed extension mounting");
    }
    emitToAllInstances(eventName, ...params) {
        for (const instance of this._apiInstances) {
            instance.emit(eventName, ...params);
        }
    }
    _loadExtension(bundle) {
        const ExtensionApi = this._ExtensionApi;
        const extPath = path.join(bundle.dir, "extension");
        try {
            const requireFunc = process.env.NODECG_TEST ? require : module.require;
            let mod = requireFunc(extPath);
            // If the extension has been generated by Babel/TypeScript and exported with "export default".
            if (mod.__esModule) {
                mod = mod.default;
            }
            const apiInstance = new ExtensionApi(bundle);
            this._apiInstances.add(apiInstance);
            const extension = mod(apiInstance);
            log.info("Mounted %s extension", bundle.name);
            this.extensions[bundle.name] = extension;
        }
        catch (err) {
            this._bundleManager.remove(bundle.name);
            log.warn("Failed to mount %s extension:\n", bundle.name, (0, errors_1.stringifyError)(err));
            if (config_1.sentryEnabled) {
                err.message = `Failed to mount ${bundle.name} extension: ${
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
                (err?.message ?? err)}`;
                Sentry.captureException(err);
            }
        }
    }
    _bundleDepsSatisfied(bundle, loadedBundles) {
        const deps = bundle.bundleDependencies;
        if (!deps) {
            return true;
        }
        const unsatisfiedDepNames = Object.keys(deps);
        const arr = this._satisfiedDepNames.get(bundle)?.slice(0) ?? [];
        loadedBundles.forEach((loadedBundle) => {
            // Find out if this loaded bundle is one of the dependencies of the bundle in question.
            // If so, check if the version loaded satisfies the dependency.
            const index = unsatisfiedDepNames.indexOf(loadedBundle.name);
            if (index > -1) {
                if (semver_1.default.satisfies(loadedBundle.version, deps[loadedBundle.name])) {
                    arr.push(loadedBundle.name);
                    unsatisfiedDepNames.splice(index, 1);
                }
            }
        });
        this._satisfiedDepNames.set(bundle, arr);
        return unsatisfiedDepNames.length === 0;
    }
}
exports.ExtensionManager = ExtensionManager;
//# sourceMappingURL=extensions.js.map