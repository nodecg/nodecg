// This file is for the typings package only.
import { NodeCG } from './types/nodecg';
import { NodeCGAPIClient } from './client/api/api.client';
import serverApiFactory from './server/api.server';
import * as LoggerStuff from './shared/logger-interface';

type NodeCGAPIServer<C extends Record<string, any> = NodeCG.Bundle.UnknownConfig> = InstanceType<
	ReturnType<typeof serverApiFactory>
> & { bundleConfig: C };

declare module './types/nodecg' {
	/**
	 * A collection of types that describe NodeCG's APIs.
	 */
	namespace NodeCG {
		/**
		 * The primary interface for the client-side API, used in dashboards and graphics.
		 * Use Intellisense (aka autocomplete) to explore the avaiable properties and methods.
		 */
		export type ClientAPI<C extends Record<string, any> = NodeCG.Bundle.UnknownConfig> = NodeCGAPIClient<C>;

		/**
		 * The primary interface for the server-side API, used in extensions.
		 * Use Intellisense (aka autocomplete) to explore the avaiable properties and methods.
		 */
		export type ServerAPI<C extends Record<string, any> = NodeCG.Bundle.UnknownConfig> = NodeCGAPIServer<C>;

		/**
		 * A Replicant used in client-side (dashboard, graphic) code.
		 * The only substantial difference between client and server Replicants
		 * is that the `value` of a ClientReplicant could always be `undefined`
		 * due to the time it takes to initialize.
		 *
		 * Detailed Intellisense docs are available from the `ClientAPI['Replicant']` type.
		 */
		export type ClientReplicant = ClientAPI['Replicant'];

		/**
		 * A Replicant used in server-side (extension) code.
		 * The only substantial difference between server and client Replicants
		 * is that the `value` of a ServerReplicant will never be unexpectedly `undefined`
		 * due to initialization time.
		 *
		 * Detailed Intellisense docs are available from the `ServerAPI['Replicant']` type.
		 */
		export type ServerReplicant = ServerAPI['Replicant'];

		/**
		 * An interface represting a NodeCG.Logger instance.
		 */
		export type LoggerInterface = LoggerStuff.LoggerInterface;
	}
}

export default NodeCG;
