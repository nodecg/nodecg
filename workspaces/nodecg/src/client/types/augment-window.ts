import type { NodeCG } from "../../types/nodecg";
import type { TypedClientSocket } from "../../types/socket-protocol";
import type { NodeCGAPIClient } from "../api/api.client";

type ConstructorType = typeof NodeCGAPIClient;

declare global {
	interface Window {
		socket: TypedClientSocket;
		NodeCG: ConstructorType;
		nodecg: NodeCGAPIClient;
		__nodecg__?: boolean;
		__renderData__: {
			bundles: NodeCG.Bundle[];
			workspaces: NodeCG.Workspace[];
		};
		WebComponentsReady: boolean;
	}

	var NodeCG: ConstructorType;
	var nodecg: NodeCGAPIClient;
	var socket: TypedClientSocket;
	var ncgConfig: NodeCG.FilteredConfig;
	var token: string;
}
