import { deepEqual as equal } from "fast-equals";
import { klona as clone } from "klona/json";
import { AbstractReplicant, isIgnoringProxy, } from "../../shared/replicants.shared";
import { createLogger } from "./logger";
const declaredReplicants = new Map();
const REPLICANT_HANDLER = {
    get(target, prop) {
        if (prop === "value" && target.status !== "declared") {
            target.log.warn("Attempted to get value before Replicant had finished declaring. " +
                "This will always return undefined.");
        }
        return target[prop];
    },
    set(target, prop, newValue) {
        if (prop !== "value" || isIgnoringProxy(target)) {
            target[prop] = newValue;
            return true;
        }
        if (newValue === target[prop]) {
            return true;
        }
        target.validate(newValue);
        target.log.replicants("running setter with", newValue);
        target._addOperation({
            path: "/",
            method: "overwrite",
            args: { newValue: clone(newValue) },
        });
        return true;
    },
};
export class ClientReplicant extends AbstractReplicant {
    constructor(name, namespace, opts, socket = window.socket) {
        super(name, namespace, opts);
        this.value = undefined;
        /**
         * When running in the browser, we have to wait until the socket joins the room
         * and the replicant is fully declared before running any additional commands.
         * After this time, commands do not need to be added to the queue and are simply executed immediately.
         */
        this._actionQueue = [];
        // Load logger
        this.log = createLogger(`Replicant/${namespace}.${name}`);
        // If replicant already exists, return that.
        const nsp = declaredReplicants.get(namespace);
        if (nsp) {
            const existing = nsp.get(name);
            if (existing) {
                existing.log.replicants("Existing replicant found, returning that instead of creating a new one.");
                return existing;
            }
        }
        else {
            declaredReplicants.set(namespace, new Map());
        }
        this._socket = socket;
        // Initialize the Replicant.
        this._declare();
        socket.on("replicant:operations", (data) => {
            this._handleOperations({
                ...data,
                operations: data.operations,
            });
        });
        // If we lose connection, redeclare everything on reconnect
        socket.on("disconnect", () => {
            this._handleDisconnect();
        });
        socket.io.on("reconnect", () => {
            this._declare();
        });
        const thisProxy = new Proxy(this, REPLICANT_HANDLER);
        declaredReplicants.get(namespace).set(name, thisProxy);
        return thisProxy;
    }
    /**
     * A map of all Replicants declared in this context. Top-level keys are namespaces,
     * child keys are Replicant names.
     */
    static get declaredReplicants() {
        const foo = {};
        for (const [key, nsp] of declaredReplicants) {
            foo[key] = Object.fromEntries(Object.entries(nsp));
        }
        return foo;
    }
    /**
     * Adds an operation to the operation queue, to be flushed at the end of the current tick.
     * @param path {string} - The object path to where this operation took place.
     * @param method {string} - The name of the operation.
     * @param args {array} - The arguments provided to this operation
     * @private
     */
    _addOperation(operation) {
        this._operationQueue.push(operation);
        if (!this._pendingOperationFlush) {
            this._pendingOperationFlush = true;
            if (this.status === "declared") {
                setTimeout(() => {
                    this._flushOperations();
                }, 0);
            }
            else {
                this._queueAction(this._flushOperations);
            }
        }
    }
    /**
     * Emits all queued operations via Socket.IO & empties this._operationQueue.
     * @private
     */
    _flushOperations() {
        this._pendingOperationFlush = false;
        if (this._operationQueue.length <= 0)
            return;
        this._socket.emit("replicant:proposeOperations", {
            name: this.name,
            namespace: this.namespace,
            operations: this._operationQueue,
            revision: this.revision,
            schemaSum: this.schemaSum,
            opts: this.opts,
        }, (rejectReason, data) => {
            if (data === null || data === void 0 ? void 0 : data.schema) {
                this.schema = data.schema;
                this.schemaSum = data.schemaSum;
            }
            if (data && data.revision !== this.revision) {
                this.log.warn("Not at head revision (ours %s, theirs %s). Change aborted & head revision applied.", this.revision, data.revision);
                this._assignValue(data.value, data.revision);
            }
            if (rejectReason) {
                if (this.listenerCount("operationsRejected") > 0) {
                    this.emit("operationsRejected", rejectReason);
                }
                else {
                    this.log.error(rejectReason);
                }
            }
        });
        this._operationQueue = [];
    }
    /**
     * Adds an "action" to the action queue. Actions are method calls on the Replicant object itself.
     * @param fn
     * @param args
     * @private
     */
    _queueAction(fn, args) {
        this._actionQueue.push({
            fn,
            args,
        });
    }
    /**
     * Emits "declareReplicant" via the socket.
     * @private
     */
    _declare() {
        if (this.status === "declared" || this.status === "declaring") {
            return;
        }
        this.status = "declaring";
        this._socket.emit("joinRoom", `replicant:${this.namespace}:${this.name}`, () => {
            this._socket.emit("replicant:declare", {
                name: this.name,
                namespace: this.namespace,
                opts: this.opts,
            }, (rejectReason, data) => {
                if (rejectReason) {
                    if (this.listenerCount("declarationRejected") > 0) {
                        this.emit("declarationRejected", rejectReason);
                        return;
                    }
                    throw new Error(rejectReason);
                }
                if (!data) {
                    if (this.listenerCount("declarationRejected") > 0) {
                        this.emit("declarationRejected", "data unexpectedly falsey");
                        return;
                    }
                    throw new Error("data unexpectedly falsey");
                }
                this.log.replicants("declareReplicant callback (value: %s, revision: %s)", data.value, data.revision);
                this.status = "declared";
                /* If the revision we get in the response doesn't match the revision we have locally,
                 * then we need to just assign the authoritative value we got back from the Replicator.
                 * Likewise, if our local value isn't an exact match to what we got back from the Replicator,
                 * just assume that the Replicator is correct and take the value it gave us.
                 */
                if (this.revision !== data.revision ||
                    !equal(this.value, data.value)) {
                    this._assignValue(data.value, data.revision);
                }
                if ("schema" in data) {
                    this.schema = data.schema;
                    this.schemaSum = data.schemaSum;
                    this.validate = this._generateValidator();
                }
                // Let listeners know that this Replicant has been successfully declared.
                this.emit("declared", data);
                /* If a replicant is declared with no defaultValue and has not yet been given a value, then `change`
                 * listeners added before declaration has completed will not fire when declaration completes, because
                 * `undefined` === `undefined`, meaning that the above `_assignValue` call won't get run.
                 *
                 * To ensure consistent behavior, we manually emit a `change` event in this case.
                 */
                if (this.value === undefined && this.revision === 0) {
                    this.emit("change", undefined, undefined, []);
                }
                // If there were any pre-declare actions queued, execute them.
                if (this._actionQueue.length > 0) {
                    this._actionQueue.forEach((item) => {
                        var _a;
                        item.fn.apply(this, (_a = item.args) !== null && _a !== void 0 ? _a : []);
                    });
                    this._actionQueue = [];
                }
            });
        });
    }
    /**
     * Overwrites the value completely, and assigns a new one.
     * @param newValue {*} - The value to assign.
     * @param revision {number} - The new revision number.
     * @private
     */
    _assignValue(newValue, revision) {
        const oldValue = clone(this.value);
        const op = {
            path: "/",
            method: "overwrite",
            args: { newValue },
        };
        this._applyOperation(op);
        if (typeof revision !== "undefined") {
            this.revision = revision;
        }
        this.emit("change", this.value, oldValue, [op]);
    }
    /**
     * Handles incoming operations performed on Array and Object Replicants.
     * Requests a fullUpdate if it determines that we're not at the latest revision of this Replicant.
     * @param data {object} - A record of operations to perform.
     * @private
     */
    _handleOperations(data) {
        if (this.status !== "declared") {
            return;
        }
        const expectedRevision = this.revision + 1;
        if (data.name !== this.name || data.namespace !== this.namespace) {
            return;
        }
        if (data.revision !== expectedRevision) {
            this.log.warn('Not at head revision (ours: "%s", expected theirs to be "%s" but got "%s"), fetching latest...', this.revision, expectedRevision, data.revision);
            this._fullUpdate(data.revision);
            return;
        }
        this.log.replicants("received replicantOperations", data);
        const oldValue = clone(this.value);
        data.operations.forEach((operation) => {
            this._applyOperation(operation);
        });
        this.revision = data.revision;
        this.emit("change", this.value, oldValue, data.operations);
    }
    _handleDisconnect() {
        this.status = "undeclared";
        this._operationQueue.length = 0;
        this._actionQueue.length = 0;
    }
    /**
     * Requests the latest value from the Replicator, discarding the local value.
     * @private
     */
    _fullUpdate(revision) {
        window.NodeCG.readReplicant(this.name, this.namespace, (data) => {
            this.emit("fullUpdate", data);
            this._assignValue(data, revision);
        });
    }
}
//# sourceMappingURL=replicant.js.map