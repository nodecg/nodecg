/* eslint-disable @typescript-eslint/triple-slash-reference */
// This file is for the typings package only.

/// <reference types="passport" />
/// <reference path="../out/server/types/augment-express-user.d.ts" />

import { DeepReadonly } from "ts-essentials";

import type { NodeCGAPIClient } from "../dist/dts/client/api/api.client.js";
import type { serverApiFactory } from "../dist/dts/server/api.server.js";
import type { AbstractReplicant } from "../dist/dts/shared/replicants.shared.js";
import type * as LoggerStuff from "../dist/dts/types/logger-interface.js";
import type { NodeCG } from "../dist/dts/types/nodecg.js";

type NodeCGAPIServer<
	C extends Record<string, any> = NodeCG.Bundle.UnknownConfig,
> = Omit<InstanceType<ReturnType<typeof serverApiFactory>>, "bundleConfig"> & {
	bundleConfig: DeepReadonly<C>;
};

declare module "../out/types/nodecg" {
	/**
	 * A collection of types that describe NodeCG's APIs.
	 */
	namespace NodeCG {
		/**
		 * The primary interface for the client-side API, used in dashboards and graphics.
		 * Use Intellisense (aka autocomplete) to explore the avaiable properties and methods.
		 */
		export type ClientAPI<
			C extends Record<string, any> = NodeCG.Bundle.UnknownConfig,
		> = NodeCGAPIClient<C>;

		/**
		 * The primary interface for the server-side API, used in extensions.
		 * Use Intellisense (aka autocomplete) to explore the avaiable properties and methods.
		 */
		export type ServerAPI<
			C extends Record<string, any> = NodeCG.Bundle.UnknownConfig,
		> = NodeCGAPIServer<C>;

		/**
		 * A Replicant used in client-side (dashboard, graphic) code.
		 */
		export type ClientReplicant<
			V,
			O extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>,
		> = AbstractReplicant<"client", V, O>;

		/**
		 * A Replicant used in server-side (extension) code.
		 */
		export type ServerReplicant<
			V,
			O extends NodeCG.Replicant.Options<V> = NodeCG.Replicant.Options<V>,
		> = AbstractReplicant<"server", V, O>;

		/**
		 * A Replicant used in server-side (extension) code with an assertion that it will have a default value provided by its schema.
		 * Cannot be used with an explicit `opts.defaultValue`, as it would override the schema's default value.
		 */
		export type ServerReplicantWithSchemaDefault<
			V,
			O extends
				NodeCG.Replicant.OptionsNoDefault = NodeCG.Replicant.OptionsNoDefault,
		> = AbstractReplicant<"server", V, O, true>;

		/**
		 * An interface represting a NodeCG.Logger instance.
		 */
		export type LoggerInterface = LoggerStuff.LoggerInterface;
	}
}

export default NodeCG;
