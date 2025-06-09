import type { ErrorObject } from "ajv";
import { TypedEmitter } from "../shared/typed-emitter";
import type { LoggerInterface } from "../types/logger-interface";
import type { NodeCG } from "../types/nodecg";
export type ReplicantValue<P extends NodeCG.Platform, V, O, S extends boolean = false> = P extends "server" ? S extends true ? V : O extends {
    defaultValue: infer D extends V;
} ? D : V | undefined : (O extends {
    defaultValue: infer D extends V;
} ? D : V) | undefined;
interface Events<P extends NodeCG.Platform, V, O, S extends boolean> {
    change: (newVal: ReplicantValue<P, V, O, S>, oldVal: ReplicantValue<P, V, O, S> | undefined, operations: NodeCG.Replicant.Operation<ReplicantValue<P, V, O, S>>[]) => void;
    declared: (data: {
        value: ReplicantValue<P, V, O, S>;
        revision: number;
    } | {
        value: ReplicantValue<P, V, O, S>;
        revision: number;
        schemaSum: string;
        schema: Record<string, any>;
    }) => void;
    declarationRejected: (rejectReason: string) => void;
    operations: (params: {
        name: string;
        namespace: string;
        operations: NodeCG.Replicant.Operation<ReplicantValue<P, V, O, S>>[];
        revision: number;
    }) => void;
    operationsRejected: (rejectReason: string) => void;
    fullUpdate: (data: ReplicantValue<P, V, O, S>) => void;
}
/**
 * If you're wondering why some things are prefixed with "_",
 * but not marked as protected or private, this is because our Proxy
 * trap handlers need to access these parts of the Replicant internals,
 * but don't have access to private or protected members.
 *
 * So, we code this like its 2010 and just use "_" on some public members.
 */
export declare abstract class AbstractReplicant<P extends NodeCG.Platform, V, O extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>, S extends boolean = false> extends TypedEmitter<Events<P, V, O, S>> {
    name: string;
    namespace: string;
    opts: O;
    revision: number;
    log: LoggerInterface;
    schema?: Record<string, any>;
    schemaSum?: string;
    status: "undeclared" | "declared" | "declaring";
    validationErrors?: null | ErrorObject[];
    protected _value: ReplicantValue<P, V, O, S> | undefined;
    protected _oldValue: ReplicantValue<P, V, O, S> | undefined;
    protected _operationQueue: NodeCG.Replicant.Operation<ReplicantValue<P, V, O, S>>[];
    protected _pendingOperationFlush: boolean;
    constructor(name: string, namespace: string, opts?: O);
    abstract get value(): ReplicantValue<P, V, O, S>;
    abstract set value(newValue: ReplicantValue<P, V, O, S>);
    /**
     * If the operation is an array mutator method, call it on the target array with the operation arguments.
     * Else, handle it with objectPath.
     */
    _applyOperation(operation: NodeCG.Replicant.Operation<V>): boolean;
    /**
     * Used to validate the new value of a replicant.
     *
     * This is a stub that will be replaced if a Schema is available.
     */
    validate: Validator;
    /**
     * Adds an operation to the operation queue, to be flushed at the end of the current tick.
     * @private
     */
    abstract _addOperation(operation: NodeCG.Replicant.Operation<V>): void;
    /**
     * Emits all queued operations via Socket.IO & empties this._operationQueue.
     * @private
     */
    abstract _flushOperations(): void;
    /**
     * Generates a JSON Schema validator function from the `schema` property of the provided replicant.
     * @param replicant {object} - The Replicant to perform the operation on.
     * @returns {function} - The generated validator function.
     */
    protected _generateValidator(): Validator;
}
export interface ValidatorOptions {
    throwOnInvalid?: boolean;
}
export type Validator = (newValue: any, opts?: ValidatorOptions) => boolean;
export declare const ARRAY_MUTATOR_METHODS: string[];
export declare function ignoreProxy(replicant: AbstractReplicant<any, any, NodeCG.Replicant.Options<any>, any>): void;
export declare function resumeProxy(replicant: AbstractReplicant<any, any, NodeCG.Replicant.Options<any>, any>): void;
export declare function isIgnoringProxy(replicant: AbstractReplicant<any, any, NodeCG.Replicant.Options<any>, any>): boolean;
/**
 * Recursively Proxies an Array or Object. Does nothing to primitive values.
 * @param replicant {object} - The Replicant in which to do the work.
 * @param value {*} - The value to recursively Proxy.
 * @param path {string} - The objectPath to this value.
 * @returns {*} - The recursively Proxied value (or just `value` unchanged, if `value` is a primitive)
 * @private
 */
export declare function proxyRecursive<T>(replicant: AbstractReplicant<any, any, NodeCG.Replicant.Options<any>, any>, value: T, path: string): T;
export {};
