/// <reference lib="dom" />
/// <reference types="node" />
/// <reference types="socket.io" />
/// <reference types="socket.io-client" />
/// <reference types="soundjs" />

import {IRouter, RequestHandler} from 'express-serve-static-core';
import * as express from 'express';

import {Logger} from './logger';
import {ReplicantOptions, Replicant} from './replicant';
import {NodeCGConfig} from './config';
import {SendMessageToBundle, SendMessageReturnType} from './nodecg-static';
import {Platform} from './platform';

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
	Logger: typeof Logger;
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
	sendMessageToBundle: SendMessageToBundle<P, M>;
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
	Router: express.Router;
	mount: IRouter['use'];
	util: {
		authCheck: RequestHandler;
	};
	extensions: {
		[bundleName: string]: (nodecg: NodeCGServer) => void;
	};
	listenFor(
		messageName: string,
		handlerFunc: (message: any, cb?: ListenForCb) => void
	): void;
	listenFor(
		messageName: string,
		bundleName: string,
		handlerFunc: (message: any, cb?: ListenForCb) => void
	): void;
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
 * Sound cue object
 */
interface Cue {
	name: string;
	assignable: boolean;
	defaultFile: string;
}

export type ListenForCb = HandledListenForCb | UnhandledListenForCb;

interface HandledListenForCb {
	handled: true;
}

interface UnhandledListenForCb {
	(...args: any[]): void;
	handled: false;
}
