import {
	Replicant,
	ReplicantOptions,
	DeclaredReplicants,
	ReplicantBrowser,
} from './replicant';
import {NodeCG} from './nodecg-instance';
import {Platform} from './platform';

/**
 * NodeCG constructor
 */
interface NodeCGStaticCommon<P extends Platform, R = Replicant<any, P>> {
	new (bundle: any, socket: SocketIOClient.Socket): NodeCG<P>;
	version: string;
	sendMessageToBundle: SendMessageToBundle<P>;
	declaredReplicants: DeclaredReplicants<P>;
	Replicant<V>(name: string, opts?: ReplicantOptions<V>): Replicant<V, P>;
	Replicant<V>(
		name: string,
		namespace?: string,
		opts?: ReplicantOptions<V>
	): Replicant<V, P>;
}

/**
 * NodeCG constructor in extensions
 */
export interface NodeCGStaticServer extends NodeCGStaticCommon<'server'> {
	readReplicant<V>(name: string, namespace?: string): void;
}

/**
 * NodeCG constructor in browser
 */
export interface NodeCGStaticBrowser extends NodeCGStaticCommon<'browser'> {
	readReplicant<V>(name: string, cb: (value: V) => void): void;
	readReplicant<V>(
		name: string,
		namespace: string,
		cb: (value: V) => void
	): void;
	waitForReplicants(...replicants: ReplicantBrowser<any>[]): Promise<void>;
}

/**
 * NodeCG constructor combined
 */
export type NodeCGStatic<P extends Platform> = P extends 'server'
	? NodeCGStaticServer
	: NodeCGStaticBrowser;

/**
 * sendMessage returns Promise in browser, void in extensions
 */
type SendMessageReturnType<P extends Platform> = P extends 'server'
	? void
	: Promise<any>;

/**
 * Combined 'sendMessageToBundle' method for browser and extensions
 */
interface SendMessageToBundle<
	P extends Platform,
	M = SendMessageReturnType<P>
> {
	(
		messageName: string,
		bundleName: string,
		cb?: (error: any, ...args: any[]) => void
	): M;
	(
		messageName: string,
		bundleName: string,
		data: any,
		cb?: (error: any, ...args: any[]) => void
	): M;
}
