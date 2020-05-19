import { NodeCGAPIClient } from '../api/api.client';
import { NodeCG } from '../../types/nodecg';
import { TypedClientSocket } from '../../types/socket-protocol';

type ConstructorType = typeof NodeCGAPIClient;

declare global {
	interface Window {
		token: string;
		socket: TypedClientSocket;
		NodeCG: ConstructorType;
		nodecg: NodeCGAPIClient;
		ncgConfig: NodeCG.FilteredConfig;
		__nodecg__?: boolean;
		__renderData__: {
			bundles: NodeCG.Bundle[];
			workspaces: NodeCG.Workspace[];
		};
	}

	const NodeCG: ConstructorType;
	const nodecg: NodeCGAPIClient;
}
