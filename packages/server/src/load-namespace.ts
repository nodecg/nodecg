import { on } from "node:events";

import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import type {
	InferNamespace,
	WidestCustomRoutes,
	WidestNamespaceFields,
} from "@nodecg/core";
import {
	formatNamespacePath,
	manifestRolesKey,
	NamespacePath,
} from "@nodecg/internal";
import {
	type ApplyLambdaToObjectValues,
	findCaseClash,
	mapEffectValues,
	mapValues,
} from "@nodecg/internal/utils";
import {
	Array,
	ConfigProvider,
	Effect,
	Exit,
	Formatter,
	HashMap,
	type HKT,
	Layer,
	Logger,
	ManagedRuntime,
	Option,
	References,
	Schema,
	Scope,
	Stream,
} from "effect";
import { HttpRouter, UrlParams } from "effect/http";
import { Reactivity } from "effect/reactivity";

import {
	type AuthProvider,
	AuthProviderRegistry,
} from "./auth/auth-provider.ts";
import { normalizeRoleLinks, RoleLinks } from "./auth/role-links.ts";
import { buildCustomRoutes } from "./build-custom-routes.ts";
import {
	buildNamespace,
	type NamespaceHandles,
	type NamespaceHandlesLambda,
} from "./build-namespace.ts";
import { resolveDataDir } from "./data-dir.ts";
import { fieldInternal } from "./field-builders/field-internal-key.ts";
import type {
	ImplementedNamespace,
	LoadedNamespace,
	OnLoadContext,
	WidenedImplementedNamespace,
} from "./implement-namespace.ts";
import {
	NamespaceRegistryService,
	type RegisteredNamespace,
} from "./namespace-registry.ts";
import { ReplicantStoreService } from "./replicant-store.ts";
import {
	disableTelemetryRouteTracing,
	OtlpEnvironment,
} from "./server/browser-telemetry.ts";
import { makeNodeHttpServer, reportReady } from "./server/node-http-server.ts";
import { routes } from "./server/routes.ts";
import { OperatingSystemService } from "./services/operating-system/operating-system.ts";
import { DrizzleSqliteRepositories } from "./services/repository/drizzle-sqlite-repositories.ts";
import { JsonFileReplicantRepository } from "./services/repository/replicant/json-file-replicant-repository.ts";
import {
	type ReplicantRepository,
	ReplicantRepositoryService,
} from "./services/repository/replicant/replicant-repository.ts";
import { InMemoryTopicBroker } from "./services/topic-broker/in-memory-topic-broker.ts";
import { OtlpTelemetry } from "./telemetry.ts";

export type StorageOption =
	| ReplicantRepository
	| Effect.Effect<ReplicantRepository, never, never>;

export type LoadNamespaceOptions = {
	readonly storage?: StorageOption;
	readonly authProviders?: ReadonlyArray<AuthProvider>;
	readonly onReady?: (address: string) => void;
};

export class OnLoadError extends Schema.TaggedError<OnLoadError>()(
	"OnLoadError",
	{ namespace: NamespacePath, cause: Schema.Defect() },
) {
	override readonly message = `onLoad for namespace "${formatNamespacePath(this.namespace)}" failed`;
}

export class ShutdownMessageError extends Schema.TaggedError<ShutdownMessageError>()(
	"ShutdownMessageError",
	{ cause: Schema.Defect() },
) {
	override readonly message = `Handling the shutdown message failed:${Formatter.format(this.cause)}`;
}

const isShutdownMessage = Schema.is(
	Schema.Tuple([Schema.Literal("shutdown"), Schema.Unknown]),
);

export class UnimplementedChild extends Schema.TaggedError<UnimplementedChild>()(
	"UnimplementedChild",
	{ namespace: Schema.String, child: Schema.String },
) {
	override readonly message = `Child "${this.child}" of namespace "${this.namespace}" is not implemented with its declared manifest`;
}

export class DuplicateNamespace extends Schema.TaggedError<DuplicateNamespace>()(
	"DuplicateNamespace",
	{ namespace: Schema.String, clash: Schema.String },
) {
	override readonly message =
		this.namespace === this.clash
			? `Namespace "${this.namespace}" was loaded twice`
			: `Namespace "${this.namespace}" differs from "${this.clash}" only in case`;
}

// Catch a child implemented for another manifest of the same shape
const checkChildren = Effect.fn(function* ({
	manifest,
	impl,
}: WidenedImplementedNamespace) {
	for (const [child, declared] of Object.entries(manifest.children)) {
		if (impl?.children?.[child]?.manifest !== declared) {
			return yield* UnimplementedChild.make({
				namespace: manifest.namespace,
				child,
			});
		}
	}
});

const replicantRepository = (storage: StorageOption | undefined) => {
	if (typeof storage === "undefined") {
		return JsonFileReplicantRepository;
	}
	return Effect.isEffect(storage)
		? Layer.effect(ReplicantRepositoryService, storage)
		: Layer.succeed(ReplicantRepositoryService, storage);
};

/**
 * On startup, validate all computed fields against schema
 */
const validateComputedFields = (fields: RegisteredNamespace["fields"]) =>
	Effect.forEach(
		Object.values(fields.computed),
		(field) => field[fieldInternal].getEncodedNoAuth(),
		{ concurrency: "unbounded", discard: true },
	);

const prepareNamespace = Effect.fn("prepareNamespace")(function* <
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
>(
	namespace: NamespacePath,
	implemented: ImplementedNamespace<S, CustomRoutes>,
	children: ApplyLambdaToObjectValues<NamespaceHandlesLambda, S["children"]>,
	dataDir: string,
) {
	const { fields, handles } = yield* buildNamespace(
		namespace,
		implemented,
		children,
	);
	const ctx: OnLoadContext<S> = {
		...handles.loaded,
		dataDir,
		namespacePath: namespace,
	};
	const onLoad = implemented.impl?.onLoad;
	const runOnLoad =
		typeof onLoad === "undefined"
			? Effect.void
			: Effect.gen(function* () {
					const cleanup = yield* Effect.tryPromise({
						try: async () => onLoad(ctx),
						catch: (error) => OnLoadError.make({ namespace, cause: error }),
					});
					if (typeof cleanup === "function") {
						yield* Effect.addFinalizer(() =>
							Effect.tryPromise(async () => {
								await cleanup();
							}).pipe(
								Effect.catchTag("UnknownError", (error) =>
									Effect.logError(
										`onLoad cleanup for namespace "${formatNamespacePath(namespace)}" threw`,
										error,
									),
								),
							),
						);
					}
				}).pipe(
					Effect.withSpan("onLoad", {
						attributes: { namespace: formatNamespacePath(namespace) },
					}),
				);
	const registered: RegisteredNamespace = {
		namespace: fields.namespace,
		declaredRoles: new Set(implemented.manifest[manifestRolesKey].roles.keys()),
		frontend: implemented.impl?.frontend,
		customRoute: yield* buildCustomRoutes(implemented, ctx),
		fields,
	};
	return { handles, prepared: { registered, runOnLoad } };
});

type PreparedNamespace = Effect.Success<
	ReturnType<typeof prepareNamespace>
>["prepared"];

interface PreparedTree<S extends WidestNamespaceFields> {
	readonly handles: NamespaceHandles<S>;
	readonly prepared: ReadonlyArray<PreparedNamespace>;
}

interface ImplementedNamespaceLambda extends HKT.TypeLambda {
	readonly type: ImplementedNamespace<
		InferNamespace<this["Target"]>["fields"],
		InferNamespace<this["Target"]>["customRoutes"]
	>;
}

interface PreparedTreeLambda extends HKT.TypeLambda {
	readonly type: PreparedTree<InferNamespace<this["Target"]>["fields"]>;
}

export const loadNamespaceEffect = Effect.fn(
	function* <
		S extends WidestNamespaceFields,
		CustomRoutes extends WidestCustomRoutes,
	>(
		root: ImplementedNamespace<S, CustomRoutes>,
		options?: LoadNamespaceOptions,
	) {
		const namespaces = new Set<WidenedImplementedNamespace>();
		const walk = (implemented: WidenedImplementedNamespace) => {
			if (namespaces.has(implemented)) {
				return;
			}
			for (const child of Object.values(implemented.impl?.children ?? {})) {
				walk(child);
			}
			namespaces.add(implemented);
		};
		walk(root);

		yield* Effect.forEach(namespaces, checkChildren, { discard: true });

		const roleLinks = normalizeRoleLinks(
			Array.map(Array.fromIterable(namespaces), ({ manifest }) => manifest),
		);

		const names = new Set<string>();
		for (const { manifest } of namespaces) {
			if (names.has(manifest.namespace)) {
				return yield* DuplicateNamespace.make({
					namespace: manifest.namespace,
					clash: manifest.namespace,
				});
			}
			names.add(manifest.namespace);
		}
		const clash = findCaseClash(names);
		if (Option.isSome(clash)) {
			return yield* DuplicateNamespace.make({
				namespace: clash.value.name,
				clash: clash.value.clash,
			});
		}

		const internalServices = yield* Layer.build(ReplicantStoreService.layer);
		const dataDir = yield* resolveDataDir();

		return yield* Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const builtHandles = new WeakMap<WidenedImplementedNamespace, unknown>();

			const loadTree = <
				TreeS extends WidestNamespaceFields,
				TreeCustomRoutes extends WidestCustomRoutes,
			>(
				implemented: ImplementedNamespace<TreeS, TreeCustomRoutes>,
				namespace: NamespacePath,
			): Effect.Effect<
				PreparedTree<TreeS>,
				Effect.Error<ReturnType<typeof prepareNamespace>>,
				Effect.Services<ReturnType<typeof prepareNamespace>>
			> =>
				Effect.gen(function* () {
					// Reuse when namespace is referenced by multiple parents
					const existing = builtHandles.get(implemented);
					if (typeof existing !== "undefined") {
						return {
							handles: existing as NamespaceHandles<TreeS>,
							prepared: [],
						};
					}
					const children = yield* mapEffectValues<
						ImplementedNamespaceLambda,
						PreparedTreeLambda
					>()((child, key) => loadTree(child, Array.append(namespace, key)))(
						implemented.impl?.children,
					);
					const { handles, prepared } = yield* prepareNamespace(
						namespace,
						implemented,
						mapValues<PreparedTreeLambda, NamespaceHandlesLambda>(
							(child) => child.handles,
						)(children),
						dataDir,
					);
					builtHandles.set(implemented, handles);
					return {
						handles,
						prepared: [
							...Object.values(children).flatMap((child) => child.prepared),
							prepared,
						],
					};
				});

			const {
				handles: { loaded },
				prepared,
			} = yield* loadTree(root, [root.manifest.namespace]);
			const registered = prepared.map(({ registered }) => registered);

			yield* Effect.forEach(
				registered,
				({ fields }) => validateComputedFields(fields),
				{ concurrency: "unbounded", discard: true },
			);

			yield* Effect.forEach(prepared, ({ runOnLoad }) => runOnLoad, {
				discard: true,
			});

			const httpServer = yield* makeNodeHttpServer();
			const serve = HttpRouter.serve(routes);
			const ServerLive = (
				typeof options?.onReady === "undefined"
					? serve
					: reportReady(serve, options.onReady)
			).pipe(
				Layer.provide(NamespaceRegistryService.layer(registered)),
				Layer.provide(Layer.succeed(RoleLinks, roleLinks)),
				Layer.provide(Layer.succeed(ReplicantStoreService, store)),
				Layer.provide(
					Layer.succeed(
						AuthProviderRegistry,
						// TODO: check duplicate names
						HashMap.fromIterable(
							(options?.authProviders ?? []).map((provider) => [
								provider.name,
								provider,
							]),
						),
					),
				),
				Layer.provide(httpServer),
				Layer.provide(
					Layer.merge(NodeCrypto.layerDigest, NodeCrypto.layerSecureRandom),
				),
				Layer.provide(Layer.succeed(UrlParams.CurrentRedactedNames, [/.*/])),
				Layer.provide(disableTelemetryRouteTracing),
				Layer.provide(Layer.succeed(OtlpEnvironment, ConfigProvider.fromEnv())),
			);
			const serverContext =
				yield* Effect.context<Layer.Services<typeof ServerLive>>();

			const shutdownMessage = Effect.gen(function* () {
				const processMessages = Stream.fromAsyncIterable(
					on(process, "message"),
					(cause) => ShutdownMessageError.make({ cause }),
				);
				yield* Stream.runDrain(
					processMessages.pipe(
						Stream.filter(isShutdownMessage),
						Stream.take(1),
					),
				);
				if (process.connected) {
					process.disconnect();
				}
				process.emit("SIGINT");
			});

			const start = Layer.launch(ServerLive).pipe(
				Effect.provide(serverContext),
				Effect.raceFirst(shutdownMessage),
				Effect.satisfiesServicesType<never>(),
			);

			return {
				replicant: loaded.replicant,
				computed: loaded.computed,
				topic: loaded.topic,
				rpc: loaded.rpc,
				children: loaded.children,
				start,
			};
		}).pipe(Effect.provide(internalServices));
	},
	Effect.tapCause((cause) =>
		Effect.failCause(cause).pipe(
			Effect.withSpan("loadNamespaceEffect"),
			Effect.exit,
		),
	),
);

export type LoadedRoot<S extends WidestNamespaceFields> = LoadedNamespace<S> & {
	readonly start: () => void;
};

export const loadNamespace = <
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
>(
	root: ImplementedNamespace<S, CustomRoutes>,
	options?: LoadNamespaceOptions,
): Promise<LoadedRoot<S>> => {
	const runtime = ManagedRuntime.make(
		Layer.mergeAll(
			replicantRepository(options?.storage),
			InMemoryTopicBroker,
			DrizzleSqliteRepositories,
			Layer.effect(Scope.Scope, Effect.scope),
		).pipe(
			// Skip NODECG_ prefix for standard OTEL variables
			Layer.provideMerge(
				OtlpTelemetry.pipe(
					Layer.provide(ConfigProvider.layer(ConfigProvider.fromEnv())),
				),
			),
			Layer.provideMerge(
				Layer.merge(
					Logger.layer([Logger.consolePretty()]),
					Layer.succeed(References.MinimumLogLevel, "Warn"),
				),
			),
			Layer.provideMerge(
				ConfigProvider.layer(
					ConfigProvider.fromEnv().pipe(ConfigProvider.nested("NODECG")),
				),
			),
			Layer.provide(
				Layer.mergeAll(
					NodeCrypto.layerSecureRandom,
					OperatingSystemService.layer,
					Reactivity.layer,
				),
			),
			Layer.provideMerge(NodeServices.layer),
		),
	);
	return runtime
		.runPromise(
			loadNamespaceEffect(root, options).pipe(
				Effect.onError(() => runtime.disposeEffect),
			),
		)
		.then(({ replicant, computed, topic, rpc, children, start }) => ({
			replicant,
			computed,
			topic,
			rpc,
			children,
			start: () =>
				NodeRuntime.runMain(start, {
					teardown: (exit, onExit) =>
						void runtime
							.dispose()
							.finally(() =>
								onExit(
									Exit.isFailure(exit) && !Exit.hasInterrupts(exit) ? 1 : 0,
								),
							),
				}),
		}));
};
