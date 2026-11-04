import { on } from "node:events";

import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import type {
	EmptyNamespaceFields,
	WidestNamespaceManifests,
	WidestNamespaceFields,
} from "@nodecg-next/core";
import { manifestChildrenKey, manifestRolesKey } from "@nodecg-next/internal";
import {
	findCaseClash,
	mapEffectValues,
	mapValues,
	toError,
} from "@nodecg-next/internal/utils";
import {
	ConfigProvider,
	Context,
	Effect,
	Exit,
	Formatter,
	HashMap,
	type HKT,
	Layer,
	Logger,
	ManagedRuntime,
	Option,
	Record,
	References,
	Schema,
	Scope,
	Stream,
	Tracer,
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
	BuiltNamespaceRegistry,
	LoadedNamespacesService,
	makeCrossNamespaceHandle,
} from "./build-fields.ts";
import { adaptNamespace, buildNamespace } from "./build-namespace.ts";
import { fieldInternal } from "./field-builders/field-internal-key.ts";
import {
	type ImplementedChildren,
	type ImplementedNamespace,
	type LoadedNamespace,
	type OnLoadContext,
	type WidenedImplementedNamespace,
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
import { makeNodeHttpServer } from "./server/node-http-server.ts";
import { routes } from "./server/routes.ts";
import { OperatingSystemService } from "./services/operating-system/operating-system.ts";
import { DrizzleSqliteRepositories } from "./services/repository/drizzle-sqlite-repositories.ts";
import { JsonFileReplicantRepository } from "./services/repository/replicant/json-file-replicant-repository.ts";
import {
	type ReplicantRepository,
	ReplicantRepositoryService,
} from "./services/repository/replicant/replicant-repository.ts";
import { InMemoryTopicBroker } from "./services/topic-broker/in-memory-topic-broker.ts";
import type { TopicBrokerService } from "./services/topic-broker/topic-broker.ts";
import { OtlpTelemetry } from "./telemetry.ts";

export type StorageOption =
	| ReplicantRepository
	| Effect.Effect<ReplicantRepository, never, never>;

export type LoadNodeCGOptions<
	Shapes extends Record<string, WidestNamespaceFields>,
> = {
	// TODO: Accept array of namespaces and use namespace names for keys
	namespaces: {
		readonly [K in keyof Shapes & string]: ImplementedNamespace<Shapes[K]>;
	};
	storage?: StorageOption;
	authProviders?: ReadonlyArray<AuthProvider>;
	onReady?: (address?: string) => void;
};

export type LoadedNamespaces<
	Shapes extends Record<string, WidestNamespaceFields>,
> = {
	readonly [K in keyof Shapes & string]: LoadedNamespace<Shapes[K]>;
};

export class OnLoadError extends Schema.TaggedError<OnLoadError>()(
	"OnLoadError",
	{ namespace: Schema.String, cause: Schema.instanceOf(Error) },
) {
	override readonly message = `onLoad for namespace "${this.namespace}" failed: ${this.cause.message}`;
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

// Catch a child implemented for another manifest of the same shape
const checkChildren = Effect.fn(function* ({
	manifest,
	impl,
}: WidenedImplementedNamespace) {
	for (const [child, declared] of Object.entries(
		manifest[manifestChildrenKey],
	)) {
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

interface ImplementedNamespaceLambda extends HKT.TypeLambda {
	readonly Target: EmptyNamespaceFields;
	readonly type: ImplementedNamespace<this["Target"]>;
}

interface PreparedNamespace<S extends WidestNamespaceFields> {
	readonly registered: RegisteredNamespace;
	readonly loaded: LoadedNamespace<S>;
	readonly runOnLoad: Effect.Effect<void, OnLoadError, Scope.Scope>;
}

interface PreparedNamespaceLambda extends HKT.TypeLambda {
	readonly Target: EmptyNamespaceFields;
	readonly type: PreparedNamespace<this["Target"]>;
}

interface LoadedNamespaceLambda extends HKT.TypeLambda {
	readonly Target: EmptyNamespaceFields;
	readonly type: LoadedNamespace<this["Target"]>;
}

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
>(implemented: ImplementedNamespace<S>) {
	const contextForUse = yield* Effect.context<
		TopicBrokerService | ReplicantStoreService | BuiltNamespaceRegistry
	>().pipe(Effect.map(Context.omit(Tracer.ParentSpan)));
	const registry = yield* BuiltNamespaceRegistry;
	const loaded = yield* Effect.serviceOption(LoadedNamespacesService);
	const built = yield* buildNamespace(implemented);
	const handle = yield* adaptNamespace(built);
	const ctx: OnLoadContext<S> = {
		...handle,
		use: (cross) =>
			makeCrossNamespaceHandle(contextForUse, registry, loaded, cross),
	};
	const onLoad = implemented.impl?.onLoad;
	const runOnLoad =
		typeof onLoad === "undefined"
			? Effect.void
			: Effect.gen(function* () {
					const cleanup = yield* Effect.tryPromise({
						try: async () => onLoad(ctx),
						catch: (error) =>
							OnLoadError.make({
								namespace: implemented.manifest.namespace,
								cause: toError(error),
							}),
					});
					if (typeof cleanup === "function") {
						yield* Effect.addFinalizer(() =>
							Effect.tryPromise(async () => {
								await cleanup();
							}).pipe(
								Effect.catchTag("UnknownError", (error) =>
									Effect.logError(
										`onLoad cleanup for namespace "${implemented.manifest.namespace}" threw`,
										error,
									),
								),
							),
						);
					}
				}).pipe(
					Effect.withSpan("onLoad", {
						attributes: { namespace: implemented.manifest.namespace },
					}),
				);
	const prepared: PreparedNamespace<S> = {
		registered: {
			namespace: built.namespace,
			declaredRoles: new Set(
				implemented.manifest[manifestRolesKey].roles.keys(),
			),
			frontend: implemented.impl?.frontend,
			customRoute: yield* buildCustomRoutes(implemented, ctx),
			fields: built,
		},
		loaded: handle,
		runOnLoad,
	};
	return prepared;
});

export const loadNodeCGEffect = Effect.fn(
	function* <Shapes extends Record<string, WidestNamespaceFields>>(
		options: LoadNodeCGOptions<Shapes>,
	) {
		const namespaces = new Set(
			Record.values<string, WidenedImplementedNamespace>(options.namespaces),
		);
		const childNamespaces = new Set<
			ImplementedNamespace<EmptyNamespaceFields>
		>();
		const walkChildren = (
			children: ImplementedChildren<WidestNamespaceManifests> | undefined,
		) => {
			for (const child of Object.values(children ?? {})) {
				if (!namespaces.has(child)) {
					namespaces.add(child);
					childNamespaces.add(child);
				}
				walkChildren(child.impl?.children);
			}
		};
		for (const { impl } of namespaces) {
			walkChildren(impl?.children);
		}

		yield* Effect.forEach(namespaces, checkChildren, { discard: true });

		const roleLinks = normalizeRoleLinks(
			[...namespaces].map(({ manifest }) => manifest),
		);

		// Check duplicate namespace names
		const loaded = new Set<string>();
		for (const { manifest } of [
			...Record.values<string, WidenedImplementedNamespace>(options.namespaces),
			...childNamespaces,
		]) {
			if (loaded.has(manifest.namespace)) {
				return yield* Effect.die(
					new Error(`Namespace "${manifest.namespace}" was loaded twice`),
				);
			}
			loaded.add(manifest.namespace);
		}
		const clash = findCaseClash(loaded, []);
		if (Option.isSome(clash)) {
			return yield* Effect.die(
				new Error(
					`Namespace "${clash.value.name}" differs from "${clash.value.clash}" only in case`,
				),
			);
		}

		const internalServices = yield* Layer.build(
			Layer.merge(ReplicantStoreService.layer, BuiltNamespaceRegistry.layer),
		);

		return yield* Effect.gen(function* () {
			const store = yield* ReplicantStoreService;

			const prepared = yield* mapEffectValues<
				ImplementedNamespaceLambda,
				PreparedNamespaceLambda
			>()(prepareNamespace)<Shapes>(options.namespaces);

			const preparedChildNamespaces = yield* Effect.forEach(
				childNamespaces,
				(child) => prepareNamespace(child),
			);
			const preparedNamespaces = [
				...preparedChildNamespaces,
				...Record.values(prepared),
			];
			const registered = preparedNamespaces.map(({ registered }) => registered);

			yield* Effect.forEach(
				registered,
				({ fields }) => validateComputedFields(fields),
				{ concurrency: "unbounded", discard: true },
			);

			yield* Effect.forEach(preparedNamespaces, ({ runOnLoad }) => runOnLoad, {
				discard: true,
			});

			const namespaces: LoadedNamespaces<Shapes> = mapValues<
				PreparedNamespaceLambda,
				LoadedNamespaceLambda
			>((preparedNamespace) => preparedNamespace.loaded)<Shapes>(prepared);

			const httpServer = yield* makeNodeHttpServer({
				onReady: options.onReady,
			});
			const ServerLive = HttpRouter.serve(routes).pipe(
				Layer.provide(NamespaceRegistryService.layer(registered)),
				Layer.provide(Layer.succeed(RoleLinks, roleLinks)),
				Layer.provide(Layer.succeed(ReplicantStoreService, store)),
				Layer.provide(
					Layer.succeed(
						AuthProviderRegistry,
						// TODO: check duplicate names
						HashMap.fromIterable(
							(options.authProviders ?? []).map((provider) => [
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
			const contextForServer =
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
				Effect.provide(contextForServer),
				Effect.raceFirst(shutdownMessage),
				Effect.satisfiesServicesType<never>(),
			);

			return { namespaces, start };
		}).pipe(
			Effect.provideService(LoadedNamespacesService, loaded),
			Effect.provide(internalServices),
		);
	},
	Effect.tapCause((cause) =>
		Effect.failCause(cause).pipe(
			Effect.withSpan("loadNodeCGEffect"),
			Effect.exit,
		),
	),
);

export interface LoadedNodeCG<
	Shapes extends Record<string, WidestNamespaceFields>,
> {
	readonly namespaces: LoadedNamespaces<Shapes>;
	readonly start: () => void;
}

export const loadNodeCG = <
	Shapes extends Record<string, WidestNamespaceFields>,
>(
	options: LoadNodeCGOptions<Shapes>,
): Promise<LoadedNodeCG<Shapes>> => {
	const runtime = ManagedRuntime.make(
		Layer.mergeAll(
			replicantRepository(options.storage),
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
					NodeServices.layer,
					NodeCrypto.layerSecureRandom,
					OperatingSystemService.layer,
					Reactivity.layer,
				),
			),
		),
	);
	return runtime
		.runPromise(
			loadNodeCGEffect(options).pipe(
				Effect.onError(() => runtime.disposeEffect),
			),
		)
		.then(({ namespaces, start }) => ({
			namespaces,
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
