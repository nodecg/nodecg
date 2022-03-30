import {EventEmitter} from 'events';

import {Logger} from './logger';
import {Platform} from './platform';

declare class ReplicantCommon<V> extends EventEmitter {
	log: Logger;
	name: string;
	opts: ReplicantOptions<V>;
	revision: number;
	validate(value?: V, options?: {throwOnInvalid?: boolean}): boolean;
	once<R>(event: 'change', listener: (value: V) => R): R;
	once<R>(event: string, listener: (...args: any[]) => R): R;
}

export class ReplicantServer<V> extends ReplicantCommon<V> {
	constructor(name: string, namespace?: string, opts?: ReplicantOptions<V>);
	value: V;
	namespace?: string;
	on(
		event: 'change',
		listener: (
			newValue: V,
			oldValue?: V,
			operationQueue?: OperationQueueItem[]
		) => void
	): this;
	[prop: string]: any;
}

export class ReplicantBrowser<V> extends ReplicantCommon<V> {
	static declaredReplicants(): DeclaredReplicants<'browser'>;
	constructor(
		name: string,
		namespace: string,
		opts: ReplicantOptions<V>,
		socket: SocketIOClient.Socket
	);
	value?: V;
	namespace: string;
	status: 'undeclared' | 'declared' | 'declaring';
	on(event: 'declared' | 'fullUpdate', listener: (data: V) => void): this;
	on(
		event: 'change',
		listener: (newValue: V, oldValue: V, dataOperations: any[]) => void
	): this;
	on(
		event:
			| 'operationsRejected'
			| 'assignmentRejected'
			| 'declarationRejected',
		listener: (rejectReason: any) => void
	): this;
	[prop: string]: any;
}

export type Replicant<V, P extends Platform> = P extends 'browser'
	? ReplicantBrowser<V>
	: ReplicantServer<V>;

/**
 * Replicant queue object
 */
export interface OperationQueueItem {
	path: string;
	method: string;
	args: any[];
}

/**
 * Declared replicant store object
 */
export interface DeclaredReplicants<P extends Platform> {
	[bundleName: string]: {[replicantName: string]: Replicant<unknown, P>};
}

/**
 * Options to pass to Replicant constructor
 */
export interface ReplicantOptions<V> {
	defaultValue?: V;
	persistent?: boolean;
	persistenceInterval?: number;
	schemaPath?: string;
}
