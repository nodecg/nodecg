import type {
	InferNamespace,
	WidestNamespaceManifests,
	WidestCustomRoutes,
	EmptyNamespaceFields,
	WidestNamespaceFields,
	NamespaceManifest,
} from "@nodecg/core";
import type { Identity, Updater } from "@nodecg/internal";
import type { Schema } from "effect";
import type { Promisable } from "type-fest";

export type FrontendConfig = {
	readonly dir: ReadonlyArray<string | URL>;
	readonly spa?: boolean;
	readonly vite?: { readonly root: string | URL };
};

export type SeedReplicant<out Replicant extends Record<string, unknown>> = {
	readonly [K in keyof Replicant & string]: () => Replicant[K];
};

export type ComputeContext<
	out Replicant extends Record<string, unknown>,
	out Computed extends Record<string, unknown>,
	out Children extends WidestNamespaceManifests,
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
	readonly children: {
		readonly [K in keyof Children & string]: ComputeContext<
			InferNamespace<Children[K]>["fields"]["replicant"],
			InferNamespace<Children[K]>["fields"]["computed"],
			InferNamespace<Children[K]>["fields"]["children"]
		>;
	};
};

export type ImplementComputed<
	in Replicant extends Record<string, unknown>,
	in out Computed extends Record<string, unknown>,
	in Children extends WidestNamespaceManifests,
> = {
	readonly [K in keyof Computed & string]: (
		ctx: ComputeContext<Replicant, Omit<Computed, K>, Children>,
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

export interface LoadedNamespace<S extends WidestNamespaceFields> {
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
	readonly children: {
		readonly [K in keyof S["children"] & string]: LoadedNamespace<
			InferNamespace<S["children"][K]>["fields"]
		>;
	};
}

export type OnLoadContext<S extends WidestNamespaceFields> =
	LoadedNamespace<S> & {
		readonly dataDir: string;
		readonly namespacePath: ReadonlyArray<string>;
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
		readonly children: {
			readonly [K in keyof S["children"] & string]: CrossNamespaceHandle<
				InferNamespace<S["children"][K]>["fields"]
			>;
		};
	};

export type RpcContext<S extends WidestNamespaceFields> =
	RpcFieldAccessors<S> & {
		readonly children: CrossNamespaceHandle<S>["children"];
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

export type NamespaceOptions<in out S extends WidestNamespaceFields> = {
	readonly seedReplicant?: SeedReplicant<S["replicant"]>;
	readonly implementComputed?: ImplementComputed<
		S["replicant"],
		S["computed"],
		S["children"]
	>;
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
					S["computed"],
					S["children"]
				>;
			}) &
	([keyof S["rpc"]] extends [never]
		? {}
		: {
				readonly implementRpc: ImplementRpc<S>;
			});

export type ImplementedChildren<Children extends WidestNamespaceManifests> = {
	readonly [K in keyof Children & string]: ImplementedNamespace<
		InferNamespace<Children[K]>["fields"],
		InferNamespace<Children[K]>["customRoutes"]
	>;
};

export interface ImplementedNamespace<
	in out S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
> {
	readonly manifest: NamespaceManifest<string, S, string, CustomRoutes>;
	readonly impl:
		| (NamespaceOptions<S> & {
				readonly frontend?: FrontendConfig;
				readonly children?: ImplementedChildren<S["children"]>;
				readonly implementCustomRoute?: ImplementCustomRoute<S, CustomRoutes>;
		  })
		| undefined;
}

export interface WidenedImplementedNamespace {
	readonly manifest: NamespaceManifest<string, EmptyNamespaceFields, string>;
	readonly impl:
		| {
				readonly children?: Readonly<
					Record<string, WidenedImplementedNamespace>
				>;
		  }
		| undefined;
}

export function implementNamespace<
	S extends WidestNamespaceFields = EmptyNamespaceFields,
	CustomRoutes extends WidestCustomRoutes = {},
>(
	manifest: NamespaceManifest<string, S, string, CustomRoutes>,
	...rest: [
		| keyof S["replicant"]
		| keyof S["computed"]
		| keyof S["rpc"]
		| keyof CustomRoutes
		| keyof S["children"],
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
						keyof S["children"],
						ImplementedChildren<S["children"]>
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
): ImplementedNamespace<S, CustomRoutes> {
	const [impl] = rest;
	return { manifest, impl };
}

type RequiredIfAnyKey<Name extends string, Keys, Value> = [Keys] extends [never]
	? { readonly [P in Name]?: Value }
	: { readonly [P in Name]: Value };
