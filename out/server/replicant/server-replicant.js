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
exports.ServerReplicant = void 0;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const internal_util_1 = require("@nodecg/internal-util");
const json_schema_lib_1 = __importDefault(require("@nodecg/json-schema-lib"));
const hasha_1 = __importDefault(require("hasha"));
const json_1 = require("klona/json");
const replicants_shared_1 = require("../../shared/replicants.shared");
const compileJsonSchema_1 = require("../../shared/utils/compileJsonSchema");
const logger_1 = require("../logger");
const schema_hacks_1 = require("./schema-hacks");
/**
 * Never instantiate this directly.
 * Always use Replicator.declare instead.
 * The Replicator needs to have complete control over the ServerReplicant class.
 */
class ServerReplicant extends replicants_shared_1.AbstractReplicant {
    constructor(name, namespace, opts = {}, startingValue = undefined) {
        super(name, namespace, opts);
        /**
         * Server Replicants are immediately considered declared.
         * Client Replicants aren't considered declared until they have
         * fetched the current value from the server, which is an
         * async operation that takes time.
         */
        this.status = "declared";
        this.log = (0, logger_1.createLogger)(`Replicant/${namespace}.${name}`);
        function getBundlePath() {
            if (internal_util_1.isLegacyProject) {
                return path.join((0, internal_util_1.getNodecgRoot)(), "bundles", namespace);
            }
            const rootPackageJson = fs.readFileSync(path.join(internal_util_1.rootPath, "package.json"), "utf-8");
            if (JSON.parse(rootPackageJson).name === namespace) {
                return internal_util_1.rootPath;
            }
            else {
                const bundlesDir = path.join(internal_util_1.rootPath, "bundles");
                const bundlesDirStat = fs.existsSync(bundlesDir)
                    ? fs.statSync(bundlesDir)
                    : null;
                if (bundlesDirStat?.isDirectory()) {
                    const bundles = fs.readdirSync(path.join(internal_util_1.rootPath, "bundles"), {
                        withFileTypes: true,
                    });
                    for (const bundleDir of bundles) {
                        if (!bundleDir.isDirectory()) {
                            continue;
                        }
                        const bundlePath = path.join(internal_util_1.rootPath, "bundles", bundleDir.name);
                        const bundlePackageJsonPath = path.join(bundlePath, "package.json");
                        if (!fs.existsSync(bundlePackageJsonPath)) {
                            continue;
                        }
                        const bundlePackageJson = fs.readFileSync(bundlePackageJsonPath, "utf-8");
                        if (JSON.parse(bundlePackageJson).name === namespace) {
                            return bundlePath;
                        }
                    }
                }
                return false;
            }
        }
        let absoluteSchemaPath;
        const schemaPath = opts.schemaPath;
        if (schemaPath) {
            if (path.isAbsolute(schemaPath)) {
                absoluteSchemaPath = schemaPath;
            }
            else {
                absoluteSchemaPath = path.join(internal_util_1.isLegacyProject ? (0, internal_util_1.getNodecgRoot)() : internal_util_1.rootPath, schemaPath);
            }
        }
        else {
            const bundlePath = getBundlePath();
            if (bundlePath) {
                absoluteSchemaPath = path.join(bundlePath, "schemas", `${encodeURIComponent(name)}.json`);
            }
        }
        if (absoluteSchemaPath && fs.existsSync(absoluteSchemaPath)) {
            try {
                const rawSchema = json_schema_lib_1.default.readSync(absoluteSchemaPath);
                const parsedSchema = (0, schema_hacks_1.formatSchema)(rawSchema.root, rawSchema.rootFile, rawSchema.files);
                if (!parsedSchema) {
                    throw new Error("parsed schema was unexpectedly undefined");
                }
                this.schema = parsedSchema;
                this.schemaSum = (0, hasha_1.default)(JSON.stringify(parsedSchema), {
                    algorithm: "sha1",
                });
                this.validate = this._generateValidator();
            }
            catch (e) {
                if (!process.env.NODECG_TEST) {
                    this.log.error("Schema could not be loaded, are you sure that it is valid JSON?\n", e.stack);
                }
            }
        }
        let defaultValue = "defaultValue" in opts ? opts.defaultValue : undefined;
        // Set the default value, if a schema is present and no default value was provided.
        if (this.schema && defaultValue === undefined) {
            defaultValue = (0, compileJsonSchema_1.getSchemaDefault)(this.schema, `${this.namespace}:${this.name}`);
        }
        // If `opts.persistent` is true and this replicant has a persisted value, try to load that persisted value.
        // Else, apply `defaultValue`.
        if (opts.persistent &&
            typeof startingValue !== "undefined" &&
            startingValue !== null) {
            if (this.validate(startingValue, { throwOnInvalid: false })) {
                this._value = (0, replicants_shared_1.proxyRecursive)(this, startingValue, "/");
                this.log.replicants("Loaded a persisted value:", startingValue);
            }
            else if (this.schema) {
                this._value = (0, replicants_shared_1.proxyRecursive)(this, (0, compileJsonSchema_1.getSchemaDefault)(this.schema, `${this.namespace}:${this.name}`), "/");
                this.log.replicants("Discarded persisted value, as it failed schema validation. Replaced with defaults from schema.");
            }
        }
        else {
            if (this.schema && defaultValue !== undefined) {
                this.validate(defaultValue);
            }
            if (defaultValue === undefined) {
                this.log.replicants('Declared "%s" in namespace "%s"\n', name, namespace);
            }
            else {
                this._value = (0, replicants_shared_1.proxyRecursive)(this, (0, json_1.klona)(defaultValue), "/");
                this.log.replicants('Declared "%s" in namespace "%s" with defaultValue:\n', name, namespace, defaultValue);
            }
        }
    }
    get value() {
        return this._value;
    }
    set value(newValue) {
        if (newValue === this._value) {
            this.log.replicants("value unchanged, no action will be taken");
            return;
        }
        this.validate(newValue);
        this.log.replicants("running setter with", newValue);
        const clonedNewVal = (0, json_1.klona)(newValue);
        this._addOperation({
            path: "/",
            method: "overwrite",
            args: {
                newValue: clonedNewVal,
            },
        });
        (0, replicants_shared_1.ignoreProxy)(this);
        this._value = (0, replicants_shared_1.proxyRecursive)(this, newValue, "/");
        (0, replicants_shared_1.resumeProxy)(this);
    }
    /**
     * Refer to the abstract base class' implementation for details.
     * @private
     */
    _addOperation(operation) {
        this._operationQueue.push(operation);
        if (!this._pendingOperationFlush) {
            this._oldValue = (0, json_1.klona)(this.value);
            this._pendingOperationFlush = true;
            process.nextTick(() => {
                this._flushOperations();
            });
        }
    }
    /**
     * Refer to the abstract base class' implementation for details.
     * @private
     */
    _flushOperations() {
        this._pendingOperationFlush = false;
        if (this._operationQueue.length <= 0)
            return;
        this.revision++;
        this.emit("operations", {
            name: this.name,
            namespace: this.namespace,
            operations: this._operationQueue,
            revision: this.revision,
        });
        const opQ = this._operationQueue;
        this._operationQueue = [];
        this.emit("change", this.value, this._oldValue, opQ);
    }
}
exports.ServerReplicant = ServerReplicant;
//# sourceMappingURL=server-replicant.js.map