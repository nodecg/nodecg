import {EventEmitter} from 'events';
import * as SocketIO from 'socket.io';
import {IRouter, RequestHandler} from 'express-serve-static-core';

/**
 * NodeCG instance
 */
interface NodeCGCommon<P extends Platform, M = SendMessageReturnType<P>> {
	bundleName: string;
	bundleConfig: any;
	bundleVersion: string;
	readonly bundleGit: {
		branch: string;
		hash: string;
		shortHash: string;
		date?: Date;
		message?: string;
	};
	Logger(name: string): typeof Logger;
	log: Logger;
	readonly config: NodeCGConfig;
	sendMessage(
		messageName: string,
		cb?: (error: any, ...args: any[]) => void
	): M;
	sendMessage(
		messageName: string,
		data: any,
		cb?: (error: any, ...args: any[]) => void
	): M;
	listenFor(messageName: string, handlerFunc: (message: any) => void): void;
	listenFor(
		messageName: string,
		bundleName: string,
		handlerFunc: (message: any) => void
	): void;
	unlisten(messageName: string, handlerFunc: (message: any) => void): void;
	unlisten(
		messageName: string,
		bundleName: string,
		handlerFunc: (message: any) => void
	): void;
	Replicant<V>(name: string, opts?: ReplicantOptions<V>): Replicant<V, P>;
	Replicant<V>(
		name: string,
		namespace: string,
		opts?: ReplicantOptions<V>
	): Replicant<V, P>;
}

/**
 * NodeCG instance in extensions
 */
export interface NodeCGServer extends NodeCGCommon<'server'> {
	getSocketIOServer(): SocketIO.Server;
	mount: IRouter['use'];
	util: {
		authCheck: RequestHandler;
	};
	extensions: {
		[bundleName: string]: (nodecg: NodeCGServer) => void;
	};
}

/**
 * NodeCG instance in browser
 */
export interface NodeCGBrowser extends NodeCGCommon<'browser'> {
	socket: SocketIOClient.Socket;
	soundReady?: boolean;
	getDialog(
		name: string,
		bundle?: string
	): ReturnType<ParentNode['querySelector']>;
	getDialogDocument(name: string, bundle?: string): Document;
	findCue(cueName: string): Cue | undefined;
	playSound(
		cueName: string,
		opts?: {updateVolume?: boolean}
	): createjs.AbstractSoundInstance;
	stopSound(cueName: string): void;
	stopAllSounds(): void;
	readReplicant<V>(name: string, cb: (value: V) => void): void;
	readReplicant<V>(
		name: string,
		namespace: string,
		cb: (value: V) => void
	): void;
}

/**
 * NodeCG instance combined
 */
export type NodeCG<P extends Platform> = P extends 'server'
	? NodeCGServer
	: NodeCGBrowser;

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
interface NodeCGStaticServer extends NodeCGStaticCommon<'server'> {
	readReplicant<V>(name: string, namespace?: string): void;
}

/**
 * NodeCG constructor in browser
 */
interface NodeCGStaticBrowser extends NodeCGStaticCommon<'browser'> {
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
 * Replicant instance
 */
interface ReplicantCommon<V, S extends boolean = true> extends EventEmitter {
	log: Logger;
	name: string;
	opts: ReplicantOptions<V, S>;
	revision: number;
	validate(value?: V, options?: {throwOnInvalid?: boolean}): boolean;
	once<R>(event: 'change', listener: (value: V) => R): R;
	once<R>(event: string, listener: (...args: any[]) => R): R;
}

/**
 * Replicant instance in extensions
 */
interface ReplicantServer<V, S extends boolean = true>
	extends ReplicantCommon<V, S> {
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

/**
 * Replicant instance in browser
 */
interface ReplicantBrowser<V, S extends boolean = true>
	extends ReplicantCommon<V, S> {
	value?: V;
	namespace: string;
	status: 'undeclared' | 'declared' | 'declaring';
	on(event: 'declared' | 'fullUpdate', listener: (data: V) => void): this;
	on(
		event: 'change',
		listener: (newValue?: V, oldValue?: V, dataOperations?: any[]) => void
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

/**
 * Replicant instance combined
 */
export type Replicant<
	V,
	P extends Platform,
	S extends boolean = true
> = P extends 'server' ? ReplicantServer<V, S> : ReplicantBrowser<V, S>;

/**
 * Replicant constructor in extensions
 */
interface ReplicantStaticServer<V, S extends boolean = true> {
	new (
		name: string,
		namespace?: string,
		opts?: ReplicantOptions<V, S>
	): Replicant<V, 'server', S>;
}

/**
 * Replicant constructor in browser
 */
interface ReplicantStaticBrowser<V, S extends boolean = true> {
	new (
		name: string,
		namespace: string,
		opts: ReplicantOptions<V, S>,
		socket: SocketIOClient.Socket
	): Replicant<V, 'browser', S>;
	declaredReplicants(): DeclaredReplicants<'browser'>;
}

/**
 * Replicant constructor combined
 */
type ReplicantStatic<V, P extends Platform> = P extends 'server'
	? ReplicantStaticServer<V>
	: ReplicantStaticBrowser<V>;

/**
 * NodeCG config exposed in extensions and browser
 */
export interface NodeCGConfig {
	host: string;
	port: number;
	developer: boolean;
	baseURL: string;
	logging: LoggerOptions;
	sentry: {
		enabled?: boolean;
		publicDsn?: string;
	};
	login: {
		enabled?: boolean;
		local?: {
			enabled: boolean;
		};
		steam?: {
			enabled: boolean;
		};
		twitch?: {
			enabled: boolean;
			clientID: string;
			scope: string;
		};
	};
	ssl?: {
		enabled: boolean;
	};
}

/**
 * NodeCG Logger class
 */
export class Logger {
	trace(...args: any[]): void;
	debug(...args: any[]): void;
	info(...args: any[]): void;
	warn(...args: any[]): void;
	error(...args: any[]): void;
	replicants(...args: any[]): void;
	static globalReconfigure(
		opts: LoggerOptions & {file: {path: string}}
	): void;
}

/**
 * Options used for Logger constructor
 */
export interface LoggerOptions {
	replicants?: boolean;
	console?: {
		enabled: boolean;
		level: LoggerLevel;
	};
	file?: {
		enabled: boolean;
		level: LoggerLevel;
	};
}

/**
 * Options to pass to Replicant constructor
 */
export interface ReplicantOptions<V, S extends boolean = true> {
	defaultValue?: V;
	persistent?: boolean;
	schemaPath?: S extends true ? string : undefined;
}

/**
 * Used to select types for browser API or extensions API
 */
type Platform = 'server' | 'browser';

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

/**
 * NodeCG logger level enum
 */
type LoggerLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error';

/**
 * Bundle enable/disable options in NodeCG config
 */
type BundlesOptions = {enabled: string[]} | {disabled: string[]};

/**
 * Replicant queue object
 */
interface OperationQueueItem {
	path: string;
	method: string;
	args: any[];
}

/**
 * Declared replicant store object
 */
interface DeclaredReplicants<P extends Platform> {
	[bundleName: string]: {[replicantName: string]: P};
}

/**
 * Sound cue object
 */
interface Cue {
	name: string;
	assignable: boolean;
	defaultFile: string;
}
