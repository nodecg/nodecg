"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeCGAPIBase = void 0;
const { version } = require("../../package.json");
const typed_emitter_1 = require("./typed-emitter");
class NodeCGAPIBase extends typed_emitter_1.TypedEmitter {
    static version = version;
    /**
     * An object containing references to all Replicants that have been declared in this `window`, sorted by bundle.
     * E.g., `NodeCG.declaredReplicants.myBundle.myRep`
     */
    static declaredReplicants;
    /**
     * Lets you easily wait for a group of Replicants to finish declaring.
     *
     * Returns a promise which is resolved once all provided Replicants
     * have emitted a `change` event, which is indicates that they must
     * have finished declaring.
     *
     * This method is only useful in client-side code.
     * Server-side code never has to wait for Replicants.
     *
     * @param replicants {Replicant}
     * @returns {Promise<any>}
     *
     * @example <caption>From a graphic or dashboard panel:</caption>
     * const rep1 = nodecg.Replicant('rep1');
     * const rep2 = nodecg.Replicant('rep2');
     *
     * // You can provide as many Replicant arguments as you want,
     * // this example just uses two Replicants.
     * NodeCG.waitForReplicants(rep1, rep2).then(() => {
     *     console.log('rep1 and rep2 are fully declared and ready to use!');
     * });
     */
    static async waitForReplicants(...replicants) {
        return new Promise((resolve) => {
            const numReplicants = replicants.length;
            let declaredReplicants = 0;
            replicants.forEach((replicant) => {
                replicant.once("change", () => {
                    declaredReplicants++;
                    if (declaredReplicants >= numReplicants) {
                        resolve();
                    }
                });
            });
        });
    }
    /**
     * The name of the bundle which this NodeCG API instance is for.
     */
    bundleName;
    /**
     * An object containing the parsed content of `cfg/<bundle-name>.json`, the contents of which
     * are read once when NodeCG starts up. Used to quickly access per-bundle configuration properties.
     */
    bundleConfig;
    /**
     * The version (from package.json) of the bundle which this NodeCG API instance is for.
     * @name NodeCG#bundleVersion
     */
    bundleVersion;
    /**
     * Provides information about the current git status of this bundle, if found.
     */
    bundleGit;
    _messageHandlers = [];
    constructor(bundle) {
        super();
        this.bundleName = bundle.name;
        this.bundleConfig = bundle.config;
        this.bundleVersion = bundle.version;
        this.bundleGit = bundle.git;
    }
    listenFor(messageName, bundleNameOrHandlerFunc, handlerFunc) {
        let bundleName;
        if (typeof bundleNameOrHandlerFunc === "string") {
            bundleName = bundleNameOrHandlerFunc;
        }
        else {
            bundleName = this.bundleName;
            handlerFunc = bundleNameOrHandlerFunc;
        }
        if (typeof handlerFunc !== "function") {
            throw new Error(`argument "handler" must be a function, but you provided a(n) ${typeof handlerFunc}`);
        }
        this.log.trace("Listening for %s from bundle %s", messageName, bundleNameOrHandlerFunc);
        this._messageHandlers.push({
            messageName,
            bundleName,
            func: handlerFunc,
        });
    }
    unlisten(messageName, bundleNameOrHandler, maybeHandler) {
        let { bundleName } = this;
        let handlerFunc = maybeHandler;
        if (typeof bundleNameOrHandler === "string") {
            bundleName = bundleNameOrHandler;
        }
        else {
            handlerFunc = bundleNameOrHandler;
        }
        if (typeof handlerFunc !== "function") {
            throw new Error(`argument "handler" must be a function, but you provided a(n) ${typeof handlerFunc}`);
        }
        this.log.trace("[%s] Removing listener for %s from bundle %s", this.bundleName, messageName, bundleName);
        // Find the index of this handler in the array.
        const index = this._messageHandlers.findIndex((handler) => handler.messageName === messageName &&
            handler.bundleName === bundleName &&
            handler.func === handlerFunc);
        // If the handler exists, remove it and return true.
        if (index >= 0) {
            this._messageHandlers.splice(index, 1);
            return true;
        }
        // Else, return false.
        return false;
    }
    Replicant(name, namespaceOrOpts, opts) {
        let namespace;
        if (typeof namespaceOrOpts === "string") {
            namespace = namespaceOrOpts;
        }
        else {
            namespace = this.bundleName;
        }
        if (typeof namespaceOrOpts !== "string") {
            opts = namespaceOrOpts;
        }
        const defaultOpts = {};
        opts = opts ?? defaultOpts;
        return this._replicantFactory(name, namespace, opts);
    }
}
exports.NodeCGAPIBase = NodeCGAPIBase;
//# sourceMappingURL=api.base.js.map