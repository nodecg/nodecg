// Native
import type { EventEmitter } from 'events';

// Packages
import type {
	ServerDefinition,
	SimpleNamespace,
	RootServer,
	ClientSideSocket,
	ServerSideClientSocket,
	ServerNamespace,
} from 'typed-socket.io';

// Ours
import type { NodeCG } from './nodecg';

export const enum UnAuthErrCode {
	CredentialsBadFormat = 'credentials_bad_format',
	CredentialsRequired = 'credentials_required',
	InternalError = 'internal_error',
	InvalidToken = 'invalid_token',
	TokenRevoked = 'token_invalidated',
}

type ProtocolError = {
	message: string;
	code: UnAuthErrCode;
	type: string;
};

export type GraphicRegRequest = {
	timestamp: number;
	pathName: string;
	bundleName: string;
	bundleVersion: string;
	bundleGit: NodeCG.Bundle.GitData;
};

export type ProtocolDefinition = {
	namespaces: {
		'/': SimpleNamespace<{
			// Messages the server may send to the clients
			ServerMessages: {
				protocol_error: ProtocolError;
				'graphic:bundleRefresh': string;
				'graphic:refreshAll': NodeCG.Bundle.Graphic;
				'graphic:refresh': NodeCG.GraphicsInstance;
				'graphic:kill': NodeCG.GraphicsInstance;
				'replicant:operations': {
					name: string;
					namespace: string;
					revision: number;
					operations: Array<NodeCG.Replicant.Operation<any>>;
				};
				message: {
					messageName: string;
					bundleName: string;
					content: unknown;
				};

				// Idk why this lib doesn't type these built-in messages
				reconnect: number;
				reconnecting: number;
				reconnect_failed: void;
			};
			// Messages clients can send to the server, with a typed response
			ClientRPCs: {
				regenerateToken: {
					request: void;
					response: void;
					error: string;
				};
				'graphic:registerSocket': {
					request: GraphicRegRequest;
					response: boolean;
					error: string;
				};
				'graphic:queryAvailability': {
					request: string;
					response: boolean;
					error: string;
				};
				'graphic:requestBundleRefresh': {
					request: string;
					response: void;
					error: string;
				};
				'graphic:requestRefreshAll': {
					request: NodeCG.Bundle.Graphic;
					response: void;
					error: string;
				};
				'graphic:requestRefresh': {
					request: NodeCG.GraphicsInstance;
					response: void;
					error: string;
				};
				'graphic:requestKill': {
					request: NodeCG.GraphicsInstance;
					response: void;
					error: string;
				};
				'replicant:declare': {
					request: {
						name: string;
						namespace: string;
						opts: NodeCG.Replicant.Options<any>;
					};
					response:
						| {
								value: any;
								revision: number;
						  }
						| {
								value: any;
								revision: number;
								schema: Record<string, any>;
								schemaSum: string;
						  };
					error: string;
				};
				'replicant:proposeOperations': {
					request:
						| {
								name: string;
								namespace: string;
								operations: Array<NodeCG.Replicant.Operation<any>>;
								opts: NodeCG.Replicant.Options<any>;
								revision: number;
						  }
						| {
								name: string;
								namespace: string;
								operations: Array<NodeCG.Replicant.Operation<any>>;
								opts: NodeCG.Replicant.Options<any>;
								revision: number;
								schema: Record<string, any>;
								schemaSum: string;
						  };
					response: {
						value: any;
						revision: number;
						schema?: Record<string, any>;
						schemaSum?: string;
					};
					error: string;
				};
				'replicant:read': {
					request: {
						name: string;
						namespace: string;
					};
					response: any;
					error: string;
				};
				message: {
					request: {
						messageName: string;
						bundleName: string;
						content: unknown;
					};
					response: unknown;
					error: void;
				};
				joinRoom: {
					request: string;
					response: void;
					error: string;
				};
			};
			// Messages clients can send to the server (without a response)
			ClientMessages: {
				// None yet
			};
		}>;
	};
} & ServerDefinition;

type MissingBits = { id: string; io: EventEmitter };
export type TypedServer = RootServer<ProtocolDefinition>;
export type RootNS = ServerNamespace<ProtocolDefinition, '/'>;
export type TypedClientSocket = ClientSideSocket<ProtocolDefinition, '/'> & MissingBits;
export type TypedServerSocket = ServerSideClientSocket<ProtocolDefinition, '/'> & MissingBits;
