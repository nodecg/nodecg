import type { DatabaseAdapter, Replicant as ReplicantModel } from "@nodecg/database-adapter-types";
import type { NodeCG } from "../../types/nodecg";
import type { RootNS, ServerToClientEvents } from "../../types/socket-protocol";
import type { ServerReplicant } from "./server-replicant";
import { ServerReplicant as Replicant } from "./server-replicant";
export declare class Replicator {
    readonly io: RootNS;
    private readonly db;
    readonly declaredReplicants: Map<string, Map<string, ServerReplicant<any, NodeCG.Replicant.Options<any>>>>;
    private readonly _uuid;
    private readonly _repEntities;
    private readonly _pendingSave;
    constructor(io: RootNS, db: DatabaseAdapter, repEntities: ReplicantModel[]);
    /**
     * Declares a Replicant.
     * @param {string} name - The name of the Replicant to declare.
     * @param {string} namespace - The namespace to which this Replicant belongs.
     * @param {object} [opts] - The options for this replicant.
     * @param {*} [opts.defaultValue] - The default value to instantiate this Replicant with. The default value is only
     * applied if this Replicant has not previously been declared and if it has no persisted value.
     * @param {boolean} [opts.persistent=true] - Whether to persist the Replicant's value to disk on every change.
     * Persisted values are re-loaded on startup.
     * @param {string} [opts.schemaPath] - The filepath at which to look for a JSON Schema for this Replicant.
     * Defaults to `nodecg/bundles/${bundleName}/schemas/${replicantName}.json`.
     * @returns {object}
     */
    declare<V, O extends NodeCG.Replicant.OptionsWithDefault<V> = NodeCG.Replicant.OptionsWithDefault<V>>(name: string, namespace: string, opts?: O): Replicant<V, O>;
    declare<V, O extends NodeCG.Replicant.OptionsNoDefault = NodeCG.Replicant.OptionsNoDefault>(name: string, namespace: string, opts?: O): Replicant<V, O>;
    /**
     * Applies an array of operations to a replicant.
     * @param replicant {object} - The Replicant to perform these operation on.
     * @param operations {array} - An array of operations.
     */
    applyOperations<V>(replicant: Replicant<V, NodeCG.Replicant.Options<V>>, operations: NodeCG.Replicant.Operation<V>[]): void;
    /**
     * Emits an event to all remote Socket.IO listeners.
     * @param namespace - The namespace in which to emit this event. Only applies to Socket.IO listeners.
     * @param eventName - The name of the event to emit.
     * @param data - The data to emit with the event.
     */
    emitToClients<T extends keyof ServerToClientEvents>(replicant: ServerReplicant<any>, eventName: T, data: Parameters<ServerToClientEvents[T]>[0]): void;
    saveAllReplicants(): void;
    saveAllReplicantsNow(): Promise<void>;
    saveReplicant(replicant: ServerReplicant<any>): void;
    private _saveReplicant;
    private _attachToSocket;
}
