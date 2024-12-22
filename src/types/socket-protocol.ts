// Ours
import type { NodeCG } from "./nodecg";

// Packages
import type { Namespace, Server, Socket as ServerSocket } from "socket.io";
import type { Socket as ClientSocket } from "socket.io-client";

interface NodeCallback<T = undefined> {
	(err: string, response: undefined): void;
	(err: undefined, response: T): void;
}

export enum UnAuthErrCode {
	CredentialsBadFormat = "credentials_bad_format",
	CredentialsRequired = "credentials_required",
	InternalError = "internal_error",
	InvalidToken = "invalid_token",
	TokenRevoked = "token_invalidated",
	InvalidSession = "invalid_session",
}

export type ProtocolError = {
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

export interface ServerToClientEvents {
	protocol_error: (error: ProtocolError) => void;
	"graphic:bundleRefresh": (bundleName: string) => void;
	"graphic:refreshAll": (graphic: NodeCG.Bundle.Graphic) => void;
	"graphic:refresh": (graphicInstance: NodeCG.GraphicsInstance) => void;
	"graphic:kill": (graphicInstance: NodeCG.GraphicsInstance) => void;
	"replicant:operations": (data: {
		name: string;
		namespace: string;
		revision: number;
		operations: Array<NodeCG.Replicant.Operation<any>>;
	}) => void;
	message: (data: {
		messageName: string;
		bundleName: string;
		content: unknown;
	}) => void;
}

export interface ClientToServerEvents {
	regenerateToken: (callback: NodeCallback) => Promise<void>;
	"graphic:registerSocket": (
		request: GraphicRegRequest,
		callback: NodeCallback<boolean>,
	) => void;
	"graphic:queryAvailability": (
		request: string,
		callback: NodeCallback<boolean>,
	) => void;
	"graphic:requestBundleRefresh": (
		request: string,
		callback: NodeCallback,
	) => void;
	"graphic:requestRefreshAll": (
		request: NodeCG.Bundle.Graphic,
		callback: NodeCallback,
	) => void;
	"graphic:requestRefresh": (
		request: NodeCG.GraphicsInstance,
		callback: NodeCallback,
	) => void;
	"graphic:requestKill": (
		request: NodeCG.GraphicsInstance,
		callback: NodeCallback,
	) => void;
	"replicant:declare": (
		request: {
			name: string;
			namespace: string;
			opts: NodeCG.Replicant.Options<any>;
		},
		callback: NodeCallback<
			| {
					value: any;
					revision: number;
			  }
			| {
					value: any;
					revision: number;
					schema: Record<string, any>;
					schemaSum: string;
			  }
		>,
	) => void;
	"replicant:proposeOperations": (
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
			  },
		callback: (
			rejectReason: string | undefined,
			data: {
				value: any;
				revision: number;
				schema?: Record<string, any>;
				schemaSum?: string;
			},
		) => void,
	) => void;
	"replicant:read": (
		request: {
			name: string;
			namespace: string;
		},
		callback: NodeCallback<unknown>,
	) => void;
	message: (
		request: {
			messageName: string;
			bundleName: string;
			content: unknown;
		},
		callback: NodeCallback<unknown>,
	) => void;
	joinRoom: (request: string, callback: NodeCallback) => void;
}

export type TypedClientSocket = ClientSocket<
	ServerToClientEvents,
	ClientToServerEvents
>;
export type TypedSocketServer = Server<
	ClientToServerEvents,
	ServerToClientEvents
>;
export type RootNS = Namespace<ClientToServerEvents, ServerToClientEvents>;
export type TypedServerSocket = ServerSocket<
	ClientToServerEvents,
	ServerToClientEvents
>;
