// This file is for the typings package only.
import { NodeCG } from './types/nodecg';
import { NodeCGAPIClient } from './client/api/api.client';
import serverApiFactory from './server/api.server';
import { AbstractLogger } from './shared/api.base';
import * as LoggerStuff from './shared/logger-interface';
import { AbstractReplicant } from './shared/replicants.shared';

declare module './types/nodecg' {
	namespace NodeCG {
		export type Replicant<T> = AbstractReplicant<T>;
		export type ClientAPI = NodeCGAPIClient;
		export type ServerAPI = InstanceType<ReturnType<typeof serverApiFactory>>;
		export type Logger = AbstractLogger;
		export type LoggerInterface = LoggerStuff.LoggerInterface;
		export type LoggerLevel = LoggerStuff.LogLevel;
	}
}

export default NodeCG;
