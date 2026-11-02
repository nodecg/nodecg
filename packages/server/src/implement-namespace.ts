import type {
	CustomRouteManifest,
	WidestChildManifests,
	WidestCustomRoutes,
	EmptyNamespaceFields,
	WidestNamespaceFields,
	NamespaceManifest,
} from "@nodecg-next/core";
import type { Identity, Updater } from "@nodecg-next/internal";
import { mergeRecords, type NestedValues } from "@nodecg-next/internal/utils";
import type { Schema } from "effect";
import type { Promisable, SetOptional } from "type-fest";

export type FrontendConfig = {
	readonly dir: ReadonlyArray<string | URL>;
	readonly spa?: boolean;
	readonly vite?: { readonly root: string | URL };
};

export type SeedReplicant<out Replicant extends Record<string, unknown>> = {
	readonly [K in keyof Replicant & string]: () => Replicant[K];
};

export type CrossComputeView<
	out Replicant extends Record<string, unknown>,
	out Computed extends Record<string, unknown>,
> = {
	readonly replicant: {
		readonly [K in keyof Replicant & string]: {
			readonly get: () => Replicant[K];
		};
	};
	readonly computed: {
		readonly [K in keyof Computed & string]: {
			readonly get: () => Computed[K];
		};
	};
};

export type ComputeContextUse = <S extends WidestNamespaceFields>(
	implemented: ImplementedNamespace<S>,
) => CrossComputeView<S["replicant"], S["computed"]>;

export type ComputeContext<
	out Replicant extends Record<string, unknown>,
	out Computed extends Record<string, unknown>,
> = {
	readonly replicant: {
		readonly [K in keyof Replicant & string]: {
			readonly get: () => Replicant[K];
		};
	};
	readonly computed: {
		readonly [K in keyof Computed & string]: {
			readonly get: () => Computed[K];
		};
	};
	readonly use: ComputeContextUse;
};

export type ImplementComputed<
	in Replicant extends Record<string, unknown>,
	in out Computed extends Record<string, unknown>,
> = {
	readonly [K in keyof Computed & string]: (
		ctx: ComputeContext<Replicant, Omit<Computed, K>>,
	) => Computed[K];
};

export type Subscribe<out Decoded> = (
	handler: (value: Decoded, oldValue: Decoded | undefined) => Promisable<void>,
) => Promise<() => Promise<void>>;

export type SubscribeTopic<out Decoded> = (
	handler: (value: Decoded) => Promisable<void>,
) => Promise<() => Promise<void>>;

export type ReplicantField<in out Decoded> = {
	readonly get: () => Decoded;
	readonly set: (value: Decoded) => Promise<void>;
	readonly update: (updater: Updater<Decoded>) => Promise<void>;
	readonly validate: (value: Decoded) => Promise<Schema.Json>;
	readonly subscribe: Subscribe<Decoded>;
};

export type ComputedField<out Decoded> = {
	readonly get: () => Decoded;
	readonly subscribe: Subscribe<Decoded>;
};

export type TopicField<in out Decoded> = {
	readonly publish: (value: Decoded) => Promise<void>;
	readonly subscribe: SubscribeTopic<Decoded>;
};

export type RpcField<in Request, out Response> = (
	request: Request,
) => Promise<Response>;

export interface LoadedNamespace<
	S extends WidestNamespaceFields = WidestNamespaceFields,
> {
	readonly replicant: {
		readonly [K in keyof S["replicant"] & string]: ReplicantField<
			S["replicant"][K]
		>;
	};
	readonly computed: {
		readonly [K in keyof S["computed"] & string]: ComputedField<
			S["computed"][K]
		>;
	};
	readonly topic: {
		readonly [K in keyof S["topic"] & string]: TopicField<S["topic"][K]>;
	};
	readonly rpc: {
		readonly [K in keyof S["rpc"] & string]: RpcField<
			S["rpc"][K]["request"],
			S["rpc"][K]["response"]
		>;
	};
}

export type OnLoadContext<S extends WidestNamespaceFields> =
	LoadedNamespace<S> & {
		readonly use: UseCrossNamespace;
	};

export type OnLoad<S extends WidestNamespaceFields> = (
	ctx: OnLoadContext<S>,
) => Promisable<void | (() => Promisable<void>)>;

export type RpcReplicantAccessor<in out Decoded> = {
	readonly get: () => Decoded;
	readonly set: (value: Decoded) => Promise<void>;
	readonly update: (updater: Updater<Decoded>) => Promise<void>;
};

export type RpcComputedAccessor<out Decoded> = {
	readonly get: () => Decoded;
};

export type RpcTopicAccessor<in Decoded> = {
	readonly publish: (value: Decoded) => Promise<void>;
};

type RpcFieldAccessors<in out S extends WidestNamespaceFields> = {
	readonly replicant: {
		readonly [K in keyof S["replicant"] & string]: RpcReplicantAccessor<
			S["replicant"][K]
		>;
	};
	readonly computed: {
		readonly [K in keyof S["computed"] & string]: RpcComputedAccessor<
			S["computed"][K]
		>;
	};
	readonly topic: {
		readonly [K in keyof S["topic"] & string]: RpcTopicAccessor<S["topic"][K]>;
	};
};

export type CrossNamespaceHandle<S extends WidestNamespaceFields> =
	RpcFieldAccessors<S> & {
		readonly rpc: {
			readonly [K in keyof S["rpc"] & string]: RpcField<
				S["rpc"][K]["request"],
				S["rpc"][K]["response"]
			>;
		};
	};

export type UseCrossNamespace = <S extends WidestNamespaceFields>(
	implemented: ImplementedNamespace<S>,
) => CrossNamespaceHandle<S>;

export type RpcContext<S extends WidestNamespaceFields> =
	RpcFieldAccessors<S> & {
		readonly use: UseCrossNamespace;
	};

export type ImplementRpc<S extends WidestNamespaceFields> = {
	readonly [K in keyof S["rpc"] & string]: (
		request: S["rpc"][K]["request"],
		ctx: RpcContext<S>,
	) => Promisable<S["rpc"][K]["response"]>;
};

export type CustomRouteContext<S extends WidestNamespaceFields> =
	OnLoadContext<S> & {
		readonly caller: Identity;
	};

export type CustomRouteHandler<S extends WidestNamespaceFields> = (
	request: Request,
	ctx: CustomRouteContext<S>,
) => Promisable<Response>;

export type ImplementCustomRoute<
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
> = {
	readonly [R in keyof CustomRoutes]: {
		readonly [M in keyof CustomRoutes[R]]: CustomRouteHandler<S>;
	};
};

type UnchangedCustomRoutes<
	CustomRoutes extends WidestCustomRoutes,
	BaseRoutes extends NestedValues<WidestCustomRoutes, CustomRouteManifest>,
> = {
	[R in keyof CustomRoutes & keyof BaseRoutes]: [
		keyof CustomRoutes[R],
	] extends [keyof BaseRoutes[R]]
		? R
		: never;
}[keyof CustomRoutes & keyof BaseRoutes];

export type NamespaceOptions<in out S extends WidestNamespaceFields> = {
	readonly seedReplicant?: SeedReplicant<S["replicant"]>;
	readonly implementComputed?: ImplementComputed<S["replicant"], S["computed"]>;
	readonly implementRpc?: ImplementRpc<S>;
	readonly onLoad?: OnLoad<S>;
};

export type RequiredOptions<S extends WidestNamespaceFields> = ([
	keyof S["replicant"],
] extends [never]
	? {}
	: { readonly seedReplicant: SeedReplicant<S["replicant"]> }) &
	([keyof S["computed"]] extends [never]
		? {}
		: {
				readonly implementComputed: ImplementComputed<
					S["replicant"],
					S["computed"]
				>;
			}) &
	([keyof S["rpc"]] extends [never]
		? {}
		: {
				readonly implementRpc: ImplementRpc<S>;
			});

export type ImplementedChildren<Children extends WidestChildManifests> = {
	readonly [K in keyof Children]: ImplementedNamespace<
		Children[K] extends NamespaceManifest<string, infer S, string> ? S : never
	>;
};

export interface ImplementedNamespace<
	in out S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes = WidestCustomRoutes,
	out Children extends WidestChildManifests = WidestChildManifests,
> {
	readonly manifest: NamespaceManifest<
		string,
		S,
		string,
		CustomRoutes,
		Children
	>;
	readonly impl:
		| (NamespaceOptions<S> & {
				readonly frontend?: FrontendConfig;
				readonly children?: ImplementedChildren<Children>;
				readonly implementCustomRoute?: ImplementCustomRoute<S, CustomRoutes>;
		  })
		| undefined;
}

export interface WidenedImplementedNamespace {
	readonly manifest: NamespaceManifest<string, EmptyNamespaceFields, string>;
	readonly impl:
		| (Omit<NamespaceOptions<EmptyNamespaceFields>, "onLoad"> & {
				readonly onLoad?: (
					ctx: never,
				) => Promisable<void | (() => Promisable<void>)>;
				readonly frontend?: FrontendConfig;
				readonly children?: ImplementedChildren<WidestChildManifests>;
		  })
		| undefined;
}

export function implementNamespace<
	S extends WidestNamespaceFields = EmptyNamespaceFields,
	CustomRoutes extends WidestCustomRoutes = {},
	Children extends WidestChildManifests = {},
>(
	manifest: NamespaceManifest<string, S, string, CustomRoutes, Children>,
	...rest: [
		| keyof S["replicant"]
		| keyof S["computed"]
		| keyof S["rpc"]
		| keyof CustomRoutes
		| keyof Children,
	] extends [never]
		? [
				options?: {
					readonly frontend?: FrontendConfig;
					readonly onLoad?: OnLoad<S>;
				},
			]
		: [
				impl: RequiredOptions<S> &
					RequiredIfAnyKey<
						"children",
						keyof Children,
						ImplementedChildren<Children>
					> &
					RequiredIfAnyKey<
						"implementCustomRoute",
						keyof CustomRoutes,
						ImplementCustomRoute<S, CustomRoutes>
					> & {
						readonly frontend?: FrontendConfig;
						readonly onLoad?: OnLoad<S>;
					},
			]
): ImplementedNamespace<S, CustomRoutes, Children> {
	const [impl] = rest;
	return { manifest, impl };
}

type RequiredIfAnyKey<Name extends string, Keys, Value> = [Keys] extends [never]
	? { readonly [P in Name]?: Value }
	: { readonly [P in Name]: Value };

type ExtensionSupplement<
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
	Children extends WidestChildManifests,
	BaseReplicantKeys extends keyof S["replicant"] & string,
	BaseComputedKeys extends keyof S["computed"] & string,
	BaseRpcKeys extends keyof S["rpc"] & string,
	BaseCustomRouteKeys extends keyof CustomRoutes,
	BaseChildKeys extends keyof Children & string,
> = RequiredIfAnyKey<
	"seedReplicant",
	keyof Omit<S["replicant"], BaseReplicantKeys>,
	SetOptional<SeedReplicant<S["replicant"]>, BaseReplicantKeys>
> &
	RequiredIfAnyKey<
		"implementComputed",
		keyof Omit<S["computed"], BaseComputedKeys>,
		SetOptional<
			ImplementComputed<S["replicant"], S["computed"]>,
			BaseComputedKeys
		>
	> &
	RequiredIfAnyKey<
		"implementRpc",
		keyof Omit<S["rpc"], BaseRpcKeys>,
		SetOptional<ImplementRpc<S>, BaseRpcKeys>
	> &
	RequiredIfAnyKey<
		"implementCustomRoute",
		Exclude<keyof CustomRoutes, BaseCustomRouteKeys>,
		SetOptional<ImplementCustomRoute<S, CustomRoutes>, BaseCustomRouteKeys>
	> &
	RequiredIfAnyKey<
		"children",
		keyof Omit<Children, BaseChildKeys>,
		SetOptional<ImplementedChildren<Children>, BaseChildKeys>
	> & {
		readonly onLoad?: OnLoad<S>;
		readonly frontend?: FrontendConfig;
	};

const combineOnLoad = <S extends WidestNamespaceFields>(
	base: OnLoad<S> | undefined,
	extension: OnLoad<S> | undefined,
): OnLoad<S> | undefined => {
	if (typeof base === "undefined") return extension;
	if (typeof extension === "undefined") return base;
	return async (ctx) => {
		const cleanupBase = await base(ctx);
		const cleanupExtension = await extension(ctx);
		return async () => {
			if (typeof cleanupExtension === "function") await cleanupExtension();
			if (typeof cleanupBase === "function") await cleanupBase();
		};
	};
};

export function implementExtendedNamespace<
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
	Children extends WidestChildManifests,
	const Base extends ImplementedNamespace<any>,
>(
	manifest: NamespaceManifest<string, S, string, CustomRoutes, Children>,
	implemented: Base,
	additional: ExtensionSupplement<
		S,
		CustomRoutes,
		Children,
		keyof Base["manifest"]["replicant"] & keyof S["replicant"] & string,
		keyof Base["manifest"]["computed"] & keyof S["computed"] & string,
		keyof Base["manifest"]["rpc"] & keyof S["rpc"] & string,
		UnchangedCustomRoutes<CustomRoutes, Base["manifest"]["customRoute"]>,
		keyof NonNullable<NonNullable<Base["impl"]>["children"]> &
			keyof Children &
			string
	>,
): ImplementedNamespace<S, CustomRoutes, Children> {
	const baseFrontend = implemented.impl?.frontend;
	const frontend =
		baseFrontend && additional.frontend
			? {
					...baseFrontend,
					...additional.frontend,
					dir: [...new Set([...baseFrontend.dir, ...additional.frontend.dir])],
				}
			: (additional.frontend ?? baseFrontend);
	return {
		manifest,
		impl: {
			seedReplicant: mergeRecords<SeedReplicant<S["replicant"]>>(
				implemented.impl?.seedReplicant,
				additional.seedReplicant,
			),
			implementComputed: mergeRecords<
				ImplementComputed<S["replicant"], S["computed"]>
			>(implemented.impl?.implementComputed, additional.implementComputed),
			implementRpc: mergeRecords<ImplementRpc<S>>(
				implemented.impl?.implementRpc,
				additional.implementRpc,
			),
			implementCustomRoute: mergeRecords<ImplementCustomRoute<S, CustomRoutes>>(
				implemented.impl?.implementCustomRoute,
				additional.implementCustomRoute,
			),
			onLoad: combineOnLoad(implemented.impl?.onLoad, additional.onLoad),
			frontend,
			children: mergeRecords<ImplementedChildren<Children>>(
				implemented.impl?.children,
				additional.children,
			),
		},
	};
}
