"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ARRAY_MUTATOR_METHODS = exports.AbstractReplicant = void 0;
exports.ignoreProxy = ignoreProxy;
exports.resumeProxy = resumeProxy;
exports.isIgnoringProxy = isIgnoringProxy;
exports.proxyRecursive = proxyRecursive;
const json_1 = require("klona/json");
const object_path_1 = __importDefault(require("object-path"));
const typed_emitter_1 = require("../shared/typed-emitter");
const compileJsonSchema_1 = require("./utils/compileJsonSchema");
const errors_1 = require("./utils/errors");
const isBrowser_1 = require("./utils/isBrowser");
/**
 * If you're wondering why some things are prefixed with "_",
 * but not marked as protected or private, this is because our Proxy
 * trap handlers need to access these parts of the Replicant internals,
 * but don't have access to private or protected members.
 *
 * So, we code this like its 2010 and just use "_" on some public members.
 */
class AbstractReplicant extends typed_emitter_1.TypedEmitter {
    name;
    namespace;
    opts;
    revision = 0;
    log; // Gets assigned by implementing classes
    schema;
    schemaSum;
    status = "undeclared";
    validationErrors = [];
    _value;
    _oldValue;
    _operationQueue = [];
    _pendingOperationFlush = false;
    constructor(name, namespace, opts = {}) {
        super();
        if (!name || typeof name !== "string") {
            throw new Error("Must supply a name when instantiating a Replicant");
        }
        if (!namespace || typeof namespace !== "string") {
            throw new Error("Must supply a namespace when instantiating a Replicant");
        }
        if (typeof opts.persistent === "undefined") {
            opts.persistent = true;
        }
        if (typeof opts.persistenceInterval === "undefined") {
            opts.persistenceInterval = DEFAULT_PERSISTENCE_INTERVAL;
        }
        this.name = name;
        this.namespace = namespace;
        this.opts = opts;
        // Prevents one-time change listeners from potentially being called twice.
        // https://github.com/nodecg/nodecg/issues/296
        const originalOnce = this.once.bind(this);
        this.once = (event, listener) => {
            if (event === "change" && this.status === "declared") {
                listener(this.value);
                return;
            }
            return originalOnce(event, listener);
        };
        /**
         * When a new "change" listener is added, chances are that the developer wants it to be initialized ASAP.
         * However, if this replicant has already been declared previously in this context, their "change"
         * handler will *not* get run until another change comes in, which may never happen for Replicants
         * that change very infrequently.
         * To resolve this, we immediately invoke all new "change" handlers if appropriate.
         */
        this.on("newListener", (event, listener) => {
            if (event === "change" && this.status === "declared") {
                listener(this.value);
            }
        });
    }
    /**
     * If the operation is an array mutator method, call it on the target array with the operation arguments.
     * Else, handle it with objectPath.
     */
    _applyOperation(operation) {
        ignoreProxy(this);
        let result;
        const path = pathStrToPathArr(operation.path);
        if (exports.ARRAY_MUTATOR_METHODS.includes(operation.method)) {
            if (typeof this.value !== "object" || this.value === null) {
                throw new Error(`expected replicant "${this.namespace}:${this.name}" to have a value with type "object", got "${typeof this
                    .value}" instead`);
            }
            const arr = object_path_1.default.get(this.value, path);
            if (!Array.isArray(arr)) {
                throw new Error(`expected to find an array in replicant "${this.namespace}:${this.name}" at path "${operation.path}"`);
            }
            // eslint-disable-next-line prefer-spread
            result = arr[operation.method].apply(arr, "args" in operation && "mutatorArgs" in operation.args
                ? operation.args.mutatorArgs
                : []);
            // Recursively check for any objects that may have been added by the above method
            // and that need to be Proxied.
            proxyRecursive(this, arr, operation.path);
        }
        else {
            switch (operation.method) {
                case "overwrite": {
                    const { newValue } = operation.args;
                    this[(0, isBrowser_1.isBrowser)() || (0, isBrowser_1.isWorker)() ? "value" : "_value"] = proxyRecursive(this, newValue, operation.path);
                    result = true;
                    break;
                }
                case "add":
                case "update": {
                    path.push(operation.args.prop);
                    let { newValue } = operation.args;
                    if (typeof newValue === "object") {
                        newValue = proxyRecursive(this, newValue, pathArrToPathStr(path));
                    }
                    result = object_path_1.default.set(this.value, path, newValue);
                    break;
                }
                case "delete":
                    // Workaround for https://github.com/mariocasciaro/object-path/issues/69
                    if (path.length === 0 || object_path_1.default.has(this.value, path)) {
                        const target = object_path_1.default.get(this.value, path);
                        result = delete target[operation.args.prop];
                    }
                    break;
                /* istanbul ignore next */
                default:
                    /* istanbul ignore next */
                    throw new Error(`Unexpected operation method "${operation.method}"`);
            }
        }
        resumeProxy(this);
        return result;
    }
    /**
     * Used to validate the new value of a replicant.
     *
     * This is a stub that will be replaced if a Schema is available.
     */
    validate = () => true;
    /**
     * Generates a JSON Schema validator function from the `schema` property of the provided replicant.
     * @param replicant {object} - The Replicant to perform the operation on.
     * @returns {function} - The generated validator function.
     */
    _generateValidator() {
        const { schema } = this;
        if (!schema) {
            throw new Error("can't generate a validator for a replicant which lacks a schema");
        }
        let validate;
        try {
            validate = (0, compileJsonSchema_1.compileJsonSchema)(schema);
        }
        catch (error) {
            throw new Error(`Error compiling JSON Schema for Replicant "${this.namespace}:${this.name}":\n\t${(0, errors_1.stringifyError)(error)}`);
        }
        /**
         * Validates a value against the current Replicant's schema.
         * Throws when the value fails validation.
         * @param [value=replicant.value] {*} - The value to validate. Defaults to the replicant's current value.
         * @param [opts] {Object}
         * @param [opts.throwOnInvalid = true] {Boolean} - Whether or not to immediately throw when the provided value fails validation against the schema.
         */
        return function (value = this.value, { throwOnInvalid = true } = {}) {
            const valid = validate(value);
            if (!valid) {
                this.validationErrors = validate.errors;
                if (throwOnInvalid) {
                    throw new Error(`Invalid value rejected for replicant "${this.name}" in namespace "${this.namespace}":\n${(0, compileJsonSchema_1.formatJsonSchemaErrors)(schema, validate.errors)}`);
                }
            }
            return valid;
        };
    }
}
exports.AbstractReplicant = AbstractReplicant;
const proxyMetadataMap = new WeakMap();
const metadataMap = new WeakMap();
const proxySet = new WeakSet();
const ignoringProxy = new WeakSet();
exports.ARRAY_MUTATOR_METHODS = [
    "copyWithin",
    "fill",
    "pop",
    "push",
    "reverse",
    "shift",
    "sort",
    "splice",
    "unshift",
];
/**
 * The default persistence interval, in milliseconds.
 */
const DEFAULT_PERSISTENCE_INTERVAL = 100;
function ignoreProxy(replicant) {
    ignoringProxy.add(replicant);
}
function resumeProxy(replicant) {
    ignoringProxy.delete(replicant);
}
function isIgnoringProxy(replicant) {
    return ignoringProxy.has(replicant);
}
const deleteTrap = function (target, prop) {
    const metadata = metadataMap.get(target);
    if (!metadata) {
        throw new Error("arrived at delete trap without any metadata");
    }
    const { replicant } = metadata;
    if (isIgnoringProxy(replicant)) {
        return delete target[prop];
    }
    // If the target doesn't have this prop, return true.
    if (!{}.hasOwnProperty.call(target, prop)) {
        return true;
    }
    if (replicant.schema) {
        const valueClone = (0, json_1.klona)(replicant.value);
        const targetClone = object_path_1.default.get(valueClone, pathStrToPathArr(metadata.path));
        delete targetClone[prop];
        replicant.validate(valueClone);
    }
    replicant._addOperation({
        path: metadata.path,
        method: "delete",
        args: { prop },
    });
    if (!(0, isBrowser_1.isBrowser)() && !(0, isBrowser_1.isWorker)()) {
        return delete target[prop];
    }
};
const CHILD_ARRAY_HANDLER = {
    get(target, prop) {
        const metadata = metadataMap.get(target);
        if (!metadata) {
            throw new Error("arrived at get trap without any metadata");
        }
        const { replicant } = metadata;
        if (isIgnoringProxy(replicant)) {
            return target[prop];
        }
        if ({}.hasOwnProperty.call(Array.prototype, prop) &&
            typeof Array.prototype[prop] === "function" &&
            target[prop] === Array.prototype[prop] &&
            exports.ARRAY_MUTATOR_METHODS.includes(prop)) {
            return (...args) => {
                if (replicant.schema) {
                    const valueClone = (0, json_1.klona)(replicant.value);
                    const targetClone = object_path_1.default.get(valueClone, pathStrToPathArr(metadata.path));
                    // eslint-disable-next-line prefer-spread
                    targetClone[prop].apply(targetClone, args);
                    replicant.validate(valueClone);
                }
                if ((0, isBrowser_1.isBrowser)() || (0, isBrowser_1.isWorker)()) {
                    metadata.replicant._addOperation({
                        path: metadata.path,
                        method: prop,
                        args: {
                            mutatorArgs: Array.prototype.slice.call(args),
                        },
                    });
                }
                else {
                    ignoreProxy(replicant);
                    metadata.replicant._addOperation({
                        path: metadata.path,
                        method: prop,
                        args: {
                            mutatorArgs: Array.prototype.slice.call(args),
                        },
                    });
                    const retValue = target[prop].apply(target, args);
                    resumeProxy(replicant);
                    // We have to re-proxy the target because the items could have been inserted.
                    proxyRecursive(replicant, target, metadata.path);
                    // TODO: This could leak a non-proxied object and cause bugs!
                    return retValue;
                }
            };
        }
        return target[prop];
    },
    set(target, prop, newValue) {
        if (target[prop] === newValue) {
            return true;
        }
        const metadata = metadataMap.get(target);
        if (!metadata) {
            throw new Error("arrived at set trap without any metadata");
        }
        const { replicant } = metadata;
        if (isIgnoringProxy(replicant)) {
            target[prop] = newValue;
            return true;
        }
        if (replicant.schema) {
            const valueClone = (0, json_1.klona)(replicant.value);
            const targetClone = object_path_1.default.get(valueClone, pathStrToPathArr(metadata.path));
            targetClone[prop] = newValue;
            replicant.validate(valueClone);
        }
        // It is crucial that this happen *before* the assignment below.
        if ({}.hasOwnProperty.call(target, prop)) {
            replicant._addOperation({
                path: metadata.path,
                method: "update",
                args: {
                    prop: prop,
                    newValue,
                },
            });
        }
        else {
            replicant._addOperation({
                path: metadata.path,
                method: "add",
                args: {
                    prop: prop,
                    newValue,
                },
            });
        }
        // If this Replicant is running in the server context, immediately apply the value.
        if (!(0, isBrowser_1.isBrowser)() && !(0, isBrowser_1.isWorker)()) {
            target[prop] = proxyRecursive(metadata.replicant, newValue, joinPathParts(metadata.path, prop));
        }
        return true;
    },
    deleteProperty: deleteTrap,
};
const CHILD_OBJECT_HANDLER = {
    get(target, prop) {
        const value = target[prop];
        const tag = Object.prototype.toString.call(value);
        const shouldBindProperty = prop !== "constructor" &&
            (tag === "[object Function]" ||
                tag === "[object AsyncFunction]" ||
                tag === "[object GeneratorFunction]");
        if (shouldBindProperty) {
            return value.bind(target);
        }
        return value;
    },
    set(target, prop, newValue) {
        if (target[prop] === newValue) {
            return true;
        }
        const metadata = metadataMap.get(target);
        if (!metadata) {
            throw new Error("arrived at set trap without any metadata");
        }
        const { replicant } = metadata;
        if (isIgnoringProxy(replicant)) {
            target[prop] = newValue;
            return true;
        }
        if (replicant.schema) {
            const valueClone = (0, json_1.klona)(replicant.value);
            const targetClone = object_path_1.default.get(valueClone, pathStrToPathArr(metadata.path));
            targetClone[prop] = newValue;
            replicant.validate(valueClone);
        }
        // It is crucial that this happen *before* the assignment below.
        if ({}.hasOwnProperty.call(target, prop)) {
            replicant._addOperation({
                path: metadata.path,
                method: "update",
                args: {
                    prop: prop,
                    newValue,
                },
            });
        }
        else {
            replicant._addOperation({
                path: metadata.path,
                method: "add",
                args: {
                    prop: prop,
                    newValue,
                },
            });
        }
        // If this Replicant is running in the server context, immediately apply the value.
        if (!(0, isBrowser_1.isBrowser)() && !(0, isBrowser_1.isWorker)()) {
            target[prop] = proxyRecursive(metadata.replicant, newValue, joinPathParts(metadata.path, prop));
        }
        return true;
    },
    deleteProperty: deleteTrap,
};
/**
 * Recursively Proxies an Array or Object. Does nothing to primitive values.
 * @param replicant {object} - The Replicant in which to do the work.
 * @param value {*} - The value to recursively Proxy.
 * @param path {string} - The objectPath to this value.
 * @returns {*} - The recursively Proxied value (or just `value` unchanged, if `value` is a primitive)
 * @private
 */
function proxyRecursive(replicant, value, path) {
    if (typeof value === "object" && value !== null) {
        let p;
        assertSingleOwner(replicant, value);
        // If "value" is already a Proxy, don't re-proxy it.
        if (proxySet.has(value)) {
            p = value;
            const metadata = proxyMetadataMap.get(value);
            metadata.path = path; // Update the path, as it may have changed.
        }
        else if (metadataMap.has(value)) {
            const metadata = metadataMap.get(value);
            if (!metadata) {
                throw new Error("metadata unexpectedly not found");
            }
            p = metadata.proxy;
            metadata.path = path; // Update the path, as it may have changed.
        }
        else {
            const handler = Array.isArray(value)
                ? CHILD_ARRAY_HANDLER
                : CHILD_OBJECT_HANDLER;
            p = new Proxy(value, handler);
            proxySet.add(p);
            const metadata = {
                replicant,
                path,
                proxy: p,
            };
            metadataMap.set(value, metadata);
            proxyMetadataMap.set(p, metadata);
        }
        for (const key in value) {
            /* istanbul ignore if */
            if (!{}.hasOwnProperty.call(value, key)) {
                continue;
            }
            const escapedKey = key.replace(/\//g, "~1");
            if (path) {
                const joinedPath = joinPathParts(path, escapedKey);
                value[key] = proxyRecursive(replicant, value[key], joinedPath);
            }
            else {
                value[key] = proxyRecursive(replicant, value[key], escapedKey);
            }
        }
        return p;
    }
    return value;
}
function joinPathParts(part1, part2) {
    return part1.endsWith("/") ? `${part1}${part2}` : `${part1}/${part2}`;
}
/**
 * Converts a string path (/a/b/c) to an array path ['a', 'b', 'c']
 * @param path {String} - The path to convert.
 * @returns {Array} - The converted path.
 */
function pathStrToPathArr(path) {
    const pathArr = path
        .substr(1)
        .split("/")
        .map((part) => 
    // De-tokenize '/' characters in path name
    part.replace(/~1/g, "/"));
    // For some reason, path arrays whose only item is an empty string cause errors.
    // In this case, we replace the path with an empty array, which seems to be fine.
    if (pathArr.length === 1 && pathArr[0] === "") {
        return [];
    }
    return pathArr;
}
/**
 * Converts an array path ['a', 'b', 'c'] to a string path /a/b/c)
 * @param path {Array} - The path to convert.
 * @returns {String} - The converted path.
 */
function pathArrToPathStr(path) {
    const strPath = path.join("/");
    if (!strPath.startsWith("/")) {
        return `/${strPath}`;
    }
    return strPath;
}
/**
 * Throws an exception if an object belongs to more than one Replicant.
 * @param replicant {object} - The Replicant that this value should belong to.
 * @param value {*} - The value to check ownership of.
 */
function assertSingleOwner(replicant, value) {
    let metadata;
    if (proxySet.has(value)) {
        metadata = proxyMetadataMap.get(value);
    }
    else if (metadataMap.has(value)) {
        metadata = metadataMap.get(value);
    }
    else {
        // If there's no metadata for this value, then it doesn't belong to any Replicants yet,
        // and we're okay to continue.
        return;
    }
    if (metadata.replicant !== replicant) {
        throw new Error(`This object belongs to another Replicant, ${metadata.replicant.namespace}::${metadata.replicant.name}.` +
            `\nA given object cannot belong to multiple Replicants. Object value:\n${JSON.stringify(value, null, 2)}`);
    }
}
//# sourceMappingURL=replicants.shared.js.map