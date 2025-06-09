import { AbstractReplicant, type ReplicantValue } from "../../shared/replicants.shared";
import type { NodeCG } from "../../types/nodecg";
import type { TypedClientSocket } from "../../types/socket-protocol";
export declare class ClientReplicant<V, O extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>> extends AbstractReplicant<"client", V, O> {
    value: ReplicantValue<"client", V, O>;
    /**
     * When running in the browser, we have to wait until the socket joins the room
     * and the replicant is fully declared before running any additional commands.
     * After this time, commands do not need to be added to the queue and are simply executed immediately.
     */
    private _actionQueue;
    private readonly _socket;
    constructor(name: string, namespace: string, opts: O, socket?: TypedClientSocket);
    /**
     * A map of all Replicants declared in this context. Top-level keys are namespaces,
     * child keys are Replicant names.
     */
    static get declaredReplicants(): Record<string, Record<string, ClientReplicant<unknown>>>;
    /**
     * Adds an operation to the operation queue, to be flushed at the end of the current tick.
     * @param path {string} - The object path to where this operation took place.
     * @param method {string} - The name of the operation.
     * @param args {array} - The arguments provided to this operation
     * @private
     */
    _addOperation(operation: NodeCG.Replicant.Operation<ReplicantValue<"client", V, O>>): void;
    /**
     * Emits all queued operations via Socket.IO & empties this._operationQueue.
     * @private
     */
    _flushOperations(): void;
    /**
     * Adds an "action" to the action queue. Actions are method calls on the Replicant object itself.
     * @param fn
     * @param args
     * @private
     */
    private _queueAction;
    /**
     * Emits "declareReplicant" via the socket.
     * @private
     */
    private _declare;
    /**
     * Overwrites the value completely, and assigns a new one.
     * @param newValue {*} - The value to assign.
     * @param revision {number} - The new revision number.
     * @private
     */
    private _assignValue;
    /**
     * Handles incoming operations performed on Array and Object Replicants.
     * Requests a fullUpdate if it determines that we're not at the latest revision of this Replicant.
     * @param data {object} - A record of operations to perform.
     * @private
     */
    private _handleOperations;
    private _handleDisconnect;
    /**
     * Requests the latest value from the Replicator, discarding the local value.
     * @private
     */
    private _fullUpdate;
}
