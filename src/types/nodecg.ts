/* eslint-disable @typescript-eslint/no-namespace */
import type * as ExpressCore from "express-serve-static-core";
import type express from "express";
import type {
	ServerToClientEvents,
	ClientToServerEvents,
} from "./socket-protocol";
import { NodeCGConfig } from "./nodecg-config-schema";
import { DatabaseAdapter } from "./database-adapter";

type Person =
	| {
			name: string;
			email?: string;
			url?: string;
	  }
	| string;

// TODO: remove namespace and combine group of types in each modules (breaking change)
export namespace NodeCG {
	/**
	 * A collection of types that represent the raw data from the `nodecg` stanza in a bundle's `package.json`.
	 */
	export namespace Manifest {
		/**
		 * An unparsed `assetCategory` from a bundle's `package.json`.
		 */
		export type UnparsedAssetCategory = {
			name: string;
			title: string;
			allowedTypes?: string[];
		};

		/**
		 * An unparsed `panel` from a bundle's `package.json`.
		 */
		export type UnparsedPanel = {
			name: string;
			title: string;
			file: string;
			headerColor?: string;
			fullbleed?: boolean;
			workspace?: string;
			dialog?: boolean;
			dialogButtons?: Array<{ name: string; type: "dismiss" | "confirm" }>;
			width?: number;
		};

		/**
		 * An unparsed `graphic` from a bundle's `package.json`.
		 */
		export type UnparsedGraphic = {
			file: string;
			width: number;
			height: number;
			singleInstance?: boolean;
		};

		/**
		 * An unparsed `mount` configuration from a bundle's `package.json`.
		 */
		export type UnparsedMount = {
			directory: string;
			endpoint: string;
		};

		/**
		 * An unparsed `soundCue` from a bundle's `package.json`.
		 */
		export type UnparsedSoundCue = {
			name: string;
			assignable?: boolean;
			defaultVolume?: number;
			defaultFile?: string;
		};

		/**
		 * An unparsed record of `bundleDependencies` from a bundle's `package.json`.
		 */
		export type UnparsedBundleDependencies = Record<string, string>;

		/**
		 * The actual structure of a bundle's `nodecg` stanza from it's `package.json`.
		 */
		export type UnparsedManifest = {
			compatibleRange: string;
			transformBareModuleSpecifiers?: boolean;
			dashboardPanels?: UnparsedPanel[];
			graphics?: UnparsedGraphic[];
			assetCategories?: UnparsedAssetCategory[];
			mount?: UnparsedMount[];
			soundCues?: UnparsedSoundCue[];
			bundleDependencies?: UnparsedBundleDependencies;
		};
	}

	/**
	 * The rough structure of a bundle's `package.json`.
	 * Only includes types that NodeCG cares about.
	 */
	export type PackageJSON = {
		name: string;
		version: string;
		license?: string;
		description?: string;
		homepage?: string;
		author?: Person;
		contributors?: Person[];
		nodecg: Manifest.UnparsedManifest;
	};

	/**
	 * A _parsed_ bundle manifest as used internally by NodeCG.
	 */
	export type Manifest = Omit<PackageJSON, "nodecg"> &
		Manifest.UnparsedManifest & { transformBareModuleSpecifiers: boolean };

	/**
	 * A collection of types that comprise a `bundle`.
	 */
	export namespace Bundle {
		export type GitData =
			| undefined
			| {
					branch: string;
					hash: string;
					shortHash: string;
			  }
			| {
					branch: string;
					hash: string;
					shortHash: string;
					date: string;
					message: string;
			  };

		export type Graphic = {
			url: string;
		} & Required<Manifest.UnparsedGraphic>;

		export type Panel = Manifest.UnparsedPanel & {
			path: string;
			headerColor: string;
			bundleName: string;
			html: string;
		} & (
				| {
						dialog: false;
						workspace: string;
				  }
				| {
						dialog: true;
				  }
			) &
			(
				| {
						fullbleed: false;
						width: number;
				  }
				| {
						fullbleed: true;
				  }
			);

		export type Mount = Manifest.UnparsedMount;

		export type SoundCue = Manifest.UnparsedSoundCue;

		export type AssetCategory = Manifest.UnparsedAssetCategory;

		export type BundleDependencies = Manifest.UnparsedBundleDependencies;

		export type UnknownConfig = Record<string, unknown>;
	}

	export type NodecgBundleConfig = {
		databaseAdapter?: DatabaseAdapter;
	};

	/**
	 * The actual type of a `bundle`.
	 */
	export type Bundle = {
		name: string;
		version: string;
		license?: string;
		description?: string;
		homepage?: string;
		author?: Person;
		contributors?: Person[];
		dir: string;
		git: Bundle.GitData;
		transformBareModuleSpecifiers: boolean;
		hasAssignableSoundCues: boolean;
		hasExtension: boolean;
		config: Bundle.UnknownConfig;
		dashboard: {
			dir: string;
			panels: Bundle.Panel[];
		};
		graphics: Bundle.Graphic[];
		assetCategories: Bundle.AssetCategory[];
		mount: Bundle.Mount[];
		soundCues: Bundle.SoundCue[];
		compatibleRange: string;
		bundleDependencies?: Bundle.BundleDependencies;
		nodecgBundleConfig: NodecgBundleConfig;
	};

	/**
	 * NodeCG's socket protocol.
	 * It is unikely that you will need to use this directly.
	 * Does not include builtin Socket.IO events such as `connect`, `disconnect`, etc.
	 */
	export type SocketProtocol = {
		serverToClient: ServerToClientEvents;
		clientToServer: ClientToServerEvents;
	};

	/**
	 * The full, parsed NodeCG config (i.e `cfg/nodecg.{json,yaml,js}`).
	 * Contains sensitive secrets!
	 * Available to server-side code (extensions) only.
	 */
	export type Config = NodeCGConfig;

	/**
	 * The filtered, minimal, parsed NodeCG config (i.e `cfg/nodecg.{json,yaml,js}`).
	 * Does not contain any sensitive secrets.
	 * Available to client-side code (dashboard, graphics) only.
	 */
	export type FilteredConfig = {
		host: string;
		port: number;
		baseURL: string;
		logging: {
			console: {
				enabled: boolean;
				level: string;
				timestamps: boolean;
				replicants: boolean;
			};
			file: {
				enabled: boolean;
				level: string;
				timestamps: boolean;
				replicants: boolean;
			};
		};
		sentry: {
			enabled: boolean;
			dsn?: string;
		};
		login: {
			enabled: boolean;
			steam?: {
				enabled: boolean;
			};
			twitch?: {
				enabled: boolean;
				clientID?: string;
				scope?: string;
			};
			local?: {
				enabled: boolean;
			};
			discord?: {
				enabled: boolean;
				clientID?: string;
				scope?: string;
			};
		};
		ssl?: {
			enabled: boolean;
		};
	};

	/**
	 * A sound cue `file`, as used in sound cue Replicants.
	 */
	export type CueFile = {
		sum: string;
		base: string;
		ext: string;
		name: string;
		url: string;
		default: boolean;
	};

	/**
	 * A sound cue definition, as used in sound cue Replicants.
	 */
	export type SoundCue = {
		name: string;
		volume: number;
		file?: CueFile;
		assignable: boolean;
		channels?: number;
		bundleName?: TemplateStringsArray;
		defaultVolume?: number | undefined;
		defaultFile?: CueFile;
	};

	/**
	 * An asset file, as used in assets Replicants.
	 */
	export type AssetFile = {
		sum: string;
		base: string;
		ext: string;
		name: string;
		namespace: string;
		category: string;
		url: string;
	};

	/**
	 * A namespace containing various types used in the Replicant system.
	 * It should be unlikely that you need to use these directly.
	 */
	export namespace Replicant {
		export type Options<D> = OptionsNoDefault | OptionsWithDefault<D>;

		export type OptionsNoDefault = {
			persistent?: boolean;
			persistenceInterval?: number;
			schemaPath?: string;
		};

		export type OptionsWithDefault<D> = {
			persistent?: boolean;
			persistenceInterval?: number;
			schemaPath?: string;
			defaultValue: D;
		};

		export type Operation<T> = {
			path: string;
		} & ( // Objects and arrays
			| { method: "overwrite"; args: { newValue: T | undefined } }
			| { method: "delete"; args: { prop: string | number | symbol } }
			| { method: "add"; args: { prop: string; newValue: any } }
			| { method: "update"; args: { prop: string; newValue: any } }

			// Array mutator methods
			// This whole thing is gross and needs to be removed in v3
			// It is rife with unsupported cases, very easy to make bugs here
			| {
					method: "copyWithin";
					args: { mutatorArgs: Parameters<any[]["copyWithin"]> };
			  }
			| { method: "fill"; args: { mutatorArgs: Parameters<any[]["fill"]> } }
			| { method: "pop" }
			| { method: "push"; args: { mutatorArgs: Parameters<any[]["push"]> } }
			| { method: "reverse" }
			| { method: "shift" }
			| { method: "sort"; args: { mutatorArgs: Parameters<any[]["sort"]> } }
			| { method: "splice"; args: { mutatorArgs: Parameters<any[]["splice"]> } }
			| {
					method: "unshift";
					args: { mutatorArgs: Parameters<any[]["unshift"]> };
			  }
		);
	}

	/**
	 * Express middleware that can be mounted to NodeCG's webserver via `nodecg.mount`.
	 */
	export type Middleware =
		ExpressCore.ApplicationRequestHandler<express.Application>;

	/**
	 * A description of an instance of a currently-open graphic.
	 * It is unlikely that you will need to use this type directly.
	 */
	export type GraphicsInstance = {
		ipv4: string;
		timestamp: number;
		bundleName: string;
		bundleVersion: string;
		bundleGit: Bundle.GitData;
		pathName: string;
		singleInstance: boolean;
		socketId: string;
		open: boolean;
		potentiallyOutOfDate: boolean;
	};

	/**
	 * A description of a dashboard workspace.
	 * It is unlikely that you will need to use this type directly.
	 */
	export type Workspace = {
		name: string;
		label: string;
		route: string;
		fullbleed?: boolean;
	};

	/**
	 * A handled `listenFor` acknowledgement.
	 * Attempting to call/invoke a handled acknowledgement will throw an error.
	 */
	export type HandledAcknowledgement = {
		handled: true;
	};

	/**
	 * An unhandled `listenFor` acknowledgement.
	 * It can safely be called/invoked.
	 */
	export type UnhandledAcknowledgement = {
		handled: false;
		(err?: any, response?: unknown): void;
	};

	/**
	 * A `listenFor` acknowledgement, sent from client to server.
	 */
	export type Acknowledgement =
		| HandledAcknowledgement
		| UnhandledAcknowledgement;

	/**
	 * A `listenFor` handler function/callback.
	 */
	export type ListenHandler = (data: any, ack?: Acknowledgement) => void;

	/**
	 * A description of NodeCG's logger interface.
	 */
	export type Logger = {
		name: string;
		trace: (...args: any[]) => void;
		debug: (...args: any[]) => void;
		info: (...args: any[]) => void;
		warn: (...args: any[]) => void;
		error: (...args: any[]) => void;
		replicants: (...args: any[]) => void;
	};

	/**
	 * The logging levels available to NodeCG.
	 */
	export enum LogLevel {
		Trace = "verbose",
		Debug = "debug",
		Info = "info",
		Warn = "warn",
		Error = "error",
		Silent = "silent",
	}

	/**
	 * A description of which platform/environment an instance of the NodeCG API is being used in.
	 * It should not be necessary to ever use this type directly in your bundle's code.
	 */
	export type Platform = "server" | "client";
}
