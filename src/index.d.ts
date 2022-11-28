// This file is for the typings package only.
import { NodeCG } from './types/nodecg';
import { NodeCGAPIClient } from './client/api/api.client';
import serverApiFactory from './server/api.server';
import * as LoggerStuff from './shared/logger-interface';

type NodeCGAPIServer<C extends Record<string, any> = NodeCG.Bundle.UnknownConfig> = InstanceType<
	ReturnType<typeof serverApiFactory>
> & { bundleConfig: C };

declare module './types/nodecg' {
	namespace NodeCG {
		export type ClientAPI<C extends Record<string, any> = NodeCG.Bundle.UnknownConfig> = NodeCGAPIClient<C>;
		export type ServerAPI<C extends Record<string, any> = NodeCG.Bundle.UnknownConfig> = NodeCGAPIServer<C>;
		export type ClientReplicant = ClientAPI['Replicant'];
		export type ServerReplicant = ServerAPI['Replicant'];
		export type LoggerInterface = LoggerStuff.LoggerInterface;
	}
}

export default NodeCG;
