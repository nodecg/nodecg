import { AbstractReplicant, type ReplicantValue } from "../../shared/replicants.shared";
import type { NodeCG } from "../../types/nodecg";
/**
 * Never instantiate this directly.
 * Always use Replicator.declare instead.
 * The Replicator needs to have complete control over the ServerReplicant class.
 */
export declare class ServerReplicant<V, O extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>> extends AbstractReplicant<"server", V, O> {
    constructor(name: string, namespace: string, opts?: O, startingValue?: V | undefined);
    get value(): ReplicantValue<"server", V, O>;
    set value(newValue: ReplicantValue<"server", V, O>);
    /**
     * Refer to the abstract base class' implementation for details.
     * @private
     */
    _addOperation(operation: NodeCG.Replicant.Operation<ReplicantValue<"server", V, O>>): void;
    /**
     * Refer to the abstract base class' implementation for details.
     * @private
     */
    _flushOperations(): void;
}
