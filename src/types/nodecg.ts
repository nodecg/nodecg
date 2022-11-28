/* eslint-disable @typescript-eslint/no-namespace */
import type * as ExpressCore from 'express-serve-static-core';
import type express from 'express';

type Person =
	| {
			name: string;
			email?: string;
			url?: string;
	  }
	| string;

type SocketIOConnectionEvents = {
	connect: void;
	connect_error: (error: Error) => void;
	connect_timeout: void;
	error: (error: Error) => void;
	disconnect: (reason: string) => void;
	reconnect: (attemptNumber: number) => void;
	reconnect_attempt: (attemptNumber: number) => void;
	reconnecting: (attemptNumber: number) => void;
	reconnect_error: (error: Error) => void;
	reconnect_failed: void;
};

export namespace NodeCG {
	export namespace Manifest {
		export type UnparsedAssetCategory = {
			name: string;
			title: string;
			allowedTypes?: string[];
		};

		export type UnparsedPanel = {
			name: string;
			title: string;
			file: string;
			headerColor?: string;
			fullbleed?: boolean;
			workspace?: string;
			dialog?: boolean;
			dialogButtons?: Array<{ name: string; type: 'dismiss' | 'confirm' }>;
			width?: number;
		};

		export type UnparsedGraphic = {
			file: string;
			width: number;
			height: number;
			singleInstance?: boolean;
		};

		export type UnparsedMount = {
			directory: string;
			endpoint: string;
		};

		export type UnparsedSoundCue = {
			name: string;
			assignable?: boolean;
			defaultVolume?: number;
			defaultFile?: string;
		};

		export type UnparsedBundleDependencies = Record<string, string>;

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

	export type Manifest = Omit<PackageJSON, 'nodecg'> &
		Manifest.UnparsedManifest & { transformBareModuleSpecifiers: boolean };

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

		export type Config = Record<string, unknown>;
	}

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
		config: Record<string, any>;
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
	};

	export type SocketEvents = {
		foo: (bar: number) => void;
	} & SocketIOConnectionEvents;

	export type FilteredConfig = {
		host: string;
		port: number;
		baseURL: string;
		logging: {
			replicants: boolean;
			console: {
				enabled: boolean;
				level: string;
				timestamps: boolean;
			};
			file: {
				enabled: boolean;
				level: string;
				timestamps: boolean;
			};
		};
		sentry: {
			enabled: boolean;
			dsn: string;
		};
		login: {
			enabled: boolean;
			steam?: {
				enabled: boolean;
			};
			twitch?: {
				enabled: boolean;
				clientID: string;
				scope: string;
			};
			local?: {
				enabled: boolean;
			};
			discord?: {
				enabled: boolean;
				clientID: string;
				scope: string;
			};
		};
		ssl?: {
			enabled: boolean;
		};
	};

	export type CueFile = {
		sum: string;
		base: string;
		ext: string;
		name: string;
		url: string;
		default: boolean;
	};

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

	export type AssetFile = {
		sum: string;
		base: string;
		ext: string;
		name: string;
		namespace: string;
		url: string;
	};

	export namespace Replicant {
		export type Options<T> = {
			persistent?: boolean;
			persistenceInterval?: number;
			schemaPath?: string;
			defaultValue?: T;
		};

		export type Operation<T> = {
			path: string;
		} & ( // Objects and arrays
			| { method: 'overwrite'; args: { newValue: T | undefined } }
			| { method: 'delete'; args: { prop: string | number | symbol } }
			| { method: 'add'; args: { prop: string; newValue: any } }
			| { method: 'update'; args: { prop: string; newValue: any } }

			// Array mutator methods
			// This whole thing is gross and needs to be removed in v3
			// It is rife with unsupported cases, very easy to make bugs here
			| { method: 'copyWithin'; args: { mutatorArgs: Parameters<any[]['copyWithin']> } }
			| { method: 'fill'; args: { mutatorArgs: Parameters<any[]['fill']> } }
			| { method: 'pop' }
			| { method: 'push'; args: { mutatorArgs: Parameters<any[]['push']> } }
			| { method: 'reverse' }
			| { method: 'shift' }
			| { method: 'sort'; args: { mutatorArgs: Parameters<any[]['sort']> } }
			| { method: 'splice'; args: { mutatorArgs: Parameters<any[]['splice']> } }
			| { method: 'unshift'; args: { mutatorArgs: Parameters<any[]['unshift']> } }
		);
	}

	export type Middleware = ExpressCore.ApplicationRequestHandler<express.Application>;

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

	export type Workspace = {
		name: string;
		label: string;
		route: string;
		fullbleed?: boolean;
	};
}
