"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Replicator = void 0;
const node_crypto_1 = require("node:crypto");
const json_1 = require("klona/json");
const errors_1 = require("../../shared/utils/errors");
const logger_1 = require("../logger");
const throttle_name_1 = require("../util/throttle-name");
const server_replicant_1 = require("./server-replicant");
const log = (0, logger_1.createLogger)("replicator");
class Replicator {
    io;
    db;
    declaredReplicants = new Map();
    _uuid = (0, node_crypto_1.randomUUID)();
    _repEntities;
    _pendingSave = new WeakMap();
    constructor(io, db, repEntities) {
        this.io = io;
        this.db = db;
        this.io = io;
        io.on("connection", (socket) => {
            this._attachToSocket(socket);
        });
        this._repEntities = repEntities;
    }
    declare(name, namespace, opts) {
        // If replicant already exists, return that.
        const nsp = this.declaredReplicants.get(namespace);
        if (nsp) {
            const existing = nsp.get(name);
            if (existing) {
                existing.log.replicants("Existing replicant found, returning that instead of creating a new one.");
                return existing;
            }
        }
        else {
            this.declaredReplicants.set(namespace, new Map());
        }
        // Look up the persisted value, if any.
        let parsedPersistedValue;
        const repEnt = this._repEntities.find((re) => re.namespace === namespace && re.name === name);
        if (repEnt) {
            try {
                parsedPersistedValue =
                    repEnt.value === "" ? undefined : JSON.parse(repEnt.value);
            }
            catch (_) {
                parsedPersistedValue = repEnt.value;
            }
        }
        // Make the replicant and add it to the declaredReplicants map
        const rep = new server_replicant_1.ServerReplicant(name, namespace, opts, parsedPersistedValue);
        this.declaredReplicants.get(namespace).set(name, rep);
        // Add persistence hooks
        rep.on("change", () => {
            this.saveReplicant(rep);
        });
        // Listen for server-side operations
        rep.on("operations", (data) => {
            this.emitToClients(rep, "replicant:operations", data);
        });
        return rep;
    }
    /**
     * Applies an array of operations to a replicant.
     * @param replicant {object} - The Replicant to perform these operation on.
     * @param operations {array} - An array of operations.
     */
    applyOperations(replicant, operations) {
        const oldValue = (0, json_1.klona)(replicant.value);
        operations.forEach((operation) => replicant._applyOperation(operation));
        replicant.revision++;
        replicant.emit("change", replicant.value, oldValue, operations);
        this.emitToClients(replicant, "replicant:operations", {
            name: replicant.name,
            namespace: replicant.namespace,
            revision: replicant.revision,
            operations,
        });
    }
    /**
     * Emits an event to all remote Socket.IO listeners.
     * @param namespace - The namespace in which to emit this event. Only applies to Socket.IO listeners.
     * @param eventName - The name of the event to emit.
     * @param data - The data to emit with the event.
     */
    emitToClients(replicant, eventName, data) {
        // Emit to clients (in the given namespace's room) using Socket.IO
        const namespace = `replicant:${replicant.namespace}:${replicant.name}`;
        log.replicants("emitting %s to %s:", eventName, namespace, JSON.stringify(data, undefined, 2));
        this.io.to(namespace).emit(eventName, data); // TODO: figure out how to type this properly
    }
    saveAllReplicants() {
        for (const replicants of this.declaredReplicants.values()) {
            for (const replicant of replicants.values()) {
                this.saveReplicant(replicant);
            }
        }
    }
    async saveAllReplicantsNow() {
        const promises = [];
        for (const replicants of this.declaredReplicants.values()) {
            for (const replicant of replicants.values()) {
                promises.push(this._saveReplicant(replicant));
            }
        }
        await Promise.all(promises);
    }
    saveReplicant(replicant) {
        if (!replicant.opts.persistent) {
            return;
        }
        (0, throttle_name_1.throttleName)(`${this._uuid}:${replicant.namespace}:${replicant.name}`, () => {
            this._saveReplicant(replicant).catch((error) => {
                log.error("Error saving replicant:", error);
            });
        }, replicant.opts.persistenceInterval);
    }
    async _saveReplicant(replicant) {
        if (!replicant.opts.persistent) {
            return;
        }
        // Return the promise so that it can still be awaited
        if (this._pendingSave.has(replicant)) {
            return this._pendingSave.get(replicant);
        }
        try {
            const promise = this.db.saveReplicant(replicant);
            this._pendingSave.set(replicant, promise);
            await promise;
        }
        catch (error) {
            replicant.log.error("Failed to persist value:", (0, errors_1.stringifyError)(error));
        }
        finally {
            this._pendingSave.delete(replicant);
        }
    }
    _attachToSocket(socket) {
        socket.on("replicant:declare", (data, cb) => {
            log.replicants("received replicant:declare", JSON.stringify(data, undefined, 2));
            try {
                const replicant = this.declare(data.name, data.namespace, data.opts);
                cb(undefined, {
                    value: replicant.value,
                    revision: replicant.revision,
                    schema: replicant.schema,
                    schemaSum: replicant.schemaSum,
                });
            }
            catch (e) {
                if (e.message.startsWith("Invalid value rejected for replicant")) {
                    cb(e.message, undefined);
                }
                else {
                    throw e;
                }
            }
        });
        socket.on("replicant:proposeOperations", (data, cb) => {
            log.replicants("received replicant:proposeOperations", JSON.stringify(data, undefined, 2));
            const serverReplicant = this.declare(data.name, data.namespace, data.opts);
            if (serverReplicant.schema &&
                (!("schemaSum" in data) || data.schemaSum !== serverReplicant.schemaSum)) {
                log.replicants("Change request %s:%s had mismatched schema sum (ours %s, theirs %s), invoking callback with new schema and fullupdate", data.namespace, data.name, serverReplicant.schemaSum, "schemaSum" in data ? data.schemaSum : "(no schema)");
                cb("Mismatched schema version, assignment rejected", {
                    schema: serverReplicant.schema,
                    schemaSum: serverReplicant.schemaSum,
                    value: serverReplicant.value,
                    revision: serverReplicant.revision,
                });
            }
            else if (serverReplicant.revision !== data.revision) {
                log.replicants("Change request %s:%s had mismatched revision (ours %s, theirs %s), invoking callback with fullupdate", data.namespace, data.name, serverReplicant.revision, data.revision);
                cb("Mismatched revision number, assignment rejected", {
                    value: serverReplicant.value,
                    revision: serverReplicant.revision,
                });
            }
            this.applyOperations(serverReplicant, data.operations);
        });
        socket.on("replicant:read", (data, cb) => {
            log.replicants("replicant:read", JSON.stringify(data, undefined, 2));
            const replicant = this.declare(data.name, data.namespace);
            if (typeof cb === "function") {
                if (replicant) {
                    cb(undefined, replicant.value);
                }
                else {
                    cb(undefined, undefined);
                }
            }
        });
    }
}
exports.Replicator = Replicator;
//# sourceMappingURL=replicator.js.map