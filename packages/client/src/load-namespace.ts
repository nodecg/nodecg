import type {
	CustomRouteManifest,
	InferNamespace,
	NamespaceManifest,
	FieldManifest,
	RpcFieldManifest,
	WidestCustomRoutes,
	WidestNamespaceFields,
	WidestRpcField,
} from "@nodecg/core";
import { customRoutePath, type Updater } from "@nodecg/internal";
import { diffSignedPatch } from "@nodecg/internal/occ";
import {
	type ApplyLambdaToObjectValues,
	mapEffectValues,
	mapValues,
	toError,
	zipPreviousSuccess,
} from "@nodecg/internal/utils";
import { effect } from "@preact/signals-core";
import {
	Array,
	Context,
	Effect,
	Fiber,
	FiberSet,
	type HKT,
	Layer,
	ManagedRuntime,
	Match,
	Option,
	Path,
	Queue,
	Ref,
	Result,
	Schema,
	Scope,
	Stream,
	Tracer,
} from "effect";
import { FetchHttpClient, Url } from "effect/http";
import type { Promisable } from "type-fest";

import { adaptAuthClient, makeAuthClient } from "./auth-client.ts";
import { type FieldSource, fieldSource } from "./derive.ts";
import {
	type ComputedCell,
	FieldCellsService,
	type FieldFailure,
	type ReplicantCell,
	type TopicCell,
} from "./field-cells.ts";
import { Loadable } from "./loadable.ts";
import { otlpTelemetry } from "./otlp-telemetry.ts";
import {
	FieldSetError,
	FieldTransportService,
	ReplicantWriteConflict,
	type FieldTransport,
} from "./services/field-transport/field-transport.ts";
import { httpFieldTransport } from "./services/field-transport/http-field-transport.ts";
import {
	type MessageChannel,
	MessageChannelService,
} from "./services/message-channel/message-channel.ts";
import { webSocketMessageChannel } from "./services/message-channel/websocket-message-channel.ts";

export type RetryPolicy = boolean | number;

const defaultResends = 9;

const subscribeCell = Effect.fn(function* <Decoded>(
	cell: ReplicantCell<Decoded> | ComputedCell<Decoded> | TopicCell<Decoded>,
	{ skipInitial }: { readonly skipInitial: boolean },
) {
	const queue = yield* Queue.make<Result.Result<Decoded, FieldFailure>>();
	yield* Effect.acquireRelease(
		Effect.sync(() => {
			let initial = true;
			return effect(() => {
				Match.value(cell.signal.value).pipe(
					Match.tag("Ready", ({ value }) => {
						if (!(skipInitial && initial)) {
							Queue.offerUnsafe(queue, Result.succeed(value.decoded));
						}
					}),
					Match.tag("Failure", ({ error }) => {
						Queue.offerUnsafe(queue, Result.fail(error));
					}),
					Match.tag("Cold", () => {}),
					Match.tag("Pending", () => {}),
					Match.exhaustive,
				);

				initial = false;
			});
		}),
		(dispose) => Effect.sync(dispose),
	);
	return Stream.fromQueue(queue);
});

const implementReplicant = Effect.fn("implementReplicant")(function* <Decoded>(
	namespace: string,
	name: string,
	manifest: FieldManifest<Decoded>,
) {
	const transport = yield* FieldTransportService;
	const cells = yield* FieldCellsService;
	const cell = yield* cells.replicant(namespace, name, manifest);

	const fetchEncoded = () => transport.getReplicant(namespace, name);
	const fetchDecoded = Effect.fn(function* () {
		const encoded = yield* fetchEncoded();
		return yield* Effect.fromResult(manifest.decode(encoded));
	});

	const get = Effect.fn("get")(function* () {
		return yield* Loadable.$match(cell.peek(), {
			Ready: ({ value }) => Effect.succeed(value.decoded),
			Failure: ({ error }) => Effect.fail(error),
			Cold: fetchDecoded,
			Pending: fetchDecoded,
		});
	});

	const readBase = Effect.fn(function* () {
		return yield* Loadable.$match(cell.peek(), {
			Ready: ({ value }) => Effect.succeed(value.encoded),
			Failure: ({ error }) => Effect.fail(error),
			Cold: fetchEncoded,
			Pending: fetchEncoded,
		});
	});

	const set = Effect.fn("set")(function* (value: Decoded) {
		const encoded = yield* Effect.fromResult(manifest.encode(value));
		yield* transport
			.updateReplicant(namespace, name, [
				{ op: "replace", path: "", value: encoded },
			])
			.pipe(
				// A whole-document replace carries no precondition, so it cannot conflict
				Effect.catchTag("RevisionConflict", Effect.die),
			);
	});

	const send = Effect.fn(function* (
		updater: Updater<Decoded>,
		base: Schema.Json,
	) {
		const current = yield* Effect.fromResult(manifest.mutableDecode(base));
		const next = yield* Effect.try({
			try: () => {
				const result = updater(current);
				if (typeof result === "undefined") {
					return current;
				}
				return result;
			},
			catch: (error) =>
				FieldSetError.make({ namespace, name, cause: toError(error) }),
		});
		const encoded = yield* Effect.fromResult(manifest.encode(next));
		const patch = yield* Effect.fromResult(diffSignedPatch(base, encoded)).pipe(
			Effect.mapError(
				(failure) =>
					new Error(
						`Diffing "${namespace}/${name}" produced an unusable patch: ${failure._tag}`,
					),
			),
			Effect.orDie,
		);
		if (!Array.isReadonlyArrayNonEmpty(patch)) {
			return;
		}
		yield* transport.updateReplicant(namespace, name, patch);
	});

	const update = Effect.fn("update")(function* (
		updater: Updater<Decoded>,
		options?: { readonly retry?: RetryPolicy },
	) {
		const retry = options?.retry ?? true;
		const resends =
			typeof retry === "boolean" ? (retry ? defaultResends : 0) : retry;
		const base = yield* Ref.make(yield* readBase());
		yield* Ref.get(base).pipe(
			Effect.flatMap((current) => send(updater, current)),
			Effect.tapErrorTag("RevisionConflict", (conflict) =>
				Ref.set(base, conflict.value),
			),
			Effect.retry({
				while: (error) => error._tag === "RevisionConflict",
				times: resends,
			}),
			Effect.catchTag("RevisionConflict", (conflict) =>
				Effect.gen(function* () {
					return yield* new ReplicantWriteConflict<Decoded>({
						namespace,
						name,
						current: yield* Effect.fromResult(manifest.decode(conflict.value)),
						revision: conflict.revision,
					});
				}),
			),
		);
	});

	const subscribe = () => subscribeCell(cell, { skipInitial: false });

	return { get, set, update, subscribe, [fieldSource]: cell.signal };
});

interface EffectToPromiseLambda extends HKT.TypeLambda {
	type: this["Target"] extends (
		...args: infer Args
	) => Effect.Effect<infer A, any, any>
		? (...args: Args) => Promise<A>
		: this["Target"] extends Effect.Effect<infer A, any, any>
			? Promise<A>
			: never;
}

type ApplyLambdaToObject<T, M extends { [K in keyof T]: HKT.TypeLambda }> = {
	[K in keyof T]: HKT.Kind<M[K], unknown, never, never, T[K]>;
};

type Subscribe<A, E> = (
	callback: (value: A, oldValue: A | undefined) => Promisable<void>,
	onError?: (error: E) => void,
) => () => void;

type SubscribeTopic<A, E> = (
	callback: (value: A) => Promisable<void>,
	onError?: (error: E) => void,
) => () => void;

interface StreamToSubscribeLambda extends HKT.TypeLambda {
	type: this["Target"] extends () => Effect.Effect<
		Stream.Stream<Result.Result<infer A, infer E>, never, any>,
		any,
		any
	>
		? Subscribe<A, E>
		: never;
}

interface StreamToSubscribeTopicLambda extends HKT.TypeLambda {
	type: this["Target"] extends () => Effect.Effect<
		Stream.Stream<Result.Result<infer A, infer E>, never, any>,
		any,
		any
	>
		? SubscribeTopic<A, E>
		: never;
}

type ReplicantFieldEffect<Decoded> = Effect.Success<
	ReturnType<typeof implementReplicant<Decoded>>
>;
export type ReplicantField<Decoded> = ApplyLambdaToObject<
	Omit<ReplicantFieldEffect<Decoded>, typeof fieldSource>,
	{
		get: EffectToPromiseLambda;
		set: EffectToPromiseLambda;
		update: EffectToPromiseLambda;
		subscribe: StreamToSubscribeLambda;
	}
> &
	FieldSource<Decoded>;

const implementComputed = Effect.fn("implementComputed")(function* <Decoded>(
	namespace: string,
	name: string,
	manifest: FieldManifest<Decoded>,
) {
	const transport = yield* FieldTransportService;
	const cells = yield* FieldCellsService;
	const cell = cells.computed(namespace, name, manifest);

	const fetchCurrent = Effect.fn(function* () {
		const encoded = yield* transport.getComputed(namespace, name);
		return yield* Effect.fromResult(manifest.decode(encoded));
	});

	const get = Effect.fn("get")(function* () {
		return yield* Loadable.$match(cell.peek(), {
			Ready: ({ value }) => Effect.succeed(value.decoded),
			Failure: ({ error }) => Effect.fail(error),
			Cold: fetchCurrent,
			Pending: fetchCurrent,
		});
	});

	const subscribe = () => subscribeCell(cell, { skipInitial: false });

	return { get, subscribe, [fieldSource]: cell.signal };
});

type ComputedFieldEffect<Decoded> = Effect.Success<
	ReturnType<typeof implementComputed<Decoded>>
>;
export type ComputedField<Decoded> = ApplyLambdaToObject<
	Omit<ComputedFieldEffect<Decoded>, typeof fieldSource>,
	{
		get: EffectToPromiseLambda;
		subscribe: StreamToSubscribeLambda;
	}
> &
	FieldSource<Decoded>;

const implementTopic = Effect.fn("implementTopic")(function* <Decoded>(
	namespace: string,
	name: string,
	manifest: FieldManifest<Decoded>,
) {
	const transport = yield* FieldTransportService;
	const cells = yield* FieldCellsService;
	const cell = cells.topic(namespace, name, manifest);

	const publish = Effect.fn("publish")(function* (value: Decoded) {
		const encoded = yield* Effect.fromResult(manifest.encode(value));
		yield* transport.publishTopic(namespace, name, encoded);
	});

	const subscribe = () => subscribeCell(cell, { skipInitial: true });

	return { publish, subscribe };
});

type TopicFieldEffect<Decoded> = Effect.Success<
	ReturnType<typeof implementTopic<Decoded>>
>;
export type TopicField<Decoded> = ApplyLambdaToObject<
	TopicFieldEffect<Decoded>,
	{
		publish: EffectToPromiseLambda;
		subscribe: StreamToSubscribeTopicLambda;
	}
>;

const implementRpc = Effect.fn("implementRpc")(function* <Request, Response>(
	namespace: string,
	name: string,
	manifest: RpcFieldManifest<Request, Response>,
) {
	const transport = yield* FieldTransportService;

	const call = Effect.fn("call")(function* (request: Request) {
		const encoded = yield* Effect.fromResult(manifest.request.encode(request));
		const response = yield* transport.callRpc(namespace, name, encoded);
		return yield* Effect.fromResult(manifest.response.decode(response));
	});

	return { call };
});

type RpcFieldEffect<Request, Response> = Effect.Success<
	ReturnType<typeof implementRpc<Request, Response>>
>;
export type RpcField<Request, Response> = ApplyLambdaToObject<
	RpcFieldEffect<Request, Response>,
	{
		call: EffectToPromiseLambda;
	}
>;

const implementCustomRoute = Effect.fn("implementCustomRoute")(function* (
	base: Option.Option<URL>,
	namespace: string,
	name: string,
) {
	const urlPath = yield* Path.Path;
	const routePath = customRoutePath(namespace, name);
	const routeUrl = Option.match(base, {
		onNone: () => routePath,
		onSome: (url) =>
			Url.setPathname(url, urlPath.join(url.pathname, routePath)).href,
	});

	return { url: routeUrl };
});

export type CustomRoute = Effect.Success<
	ReturnType<typeof implementCustomRoute>
>;

interface CustomRouteManifestLambda extends HKT.TypeLambda {
	readonly type: {
		readonly [M in keyof this["Target"]]: CustomRouteManifest;
	};
}

interface CustomRouteLambda extends HKT.TypeLambda {
	readonly type: CustomRoute;
}

interface FieldManifestLambda extends HKT.TypeLambda {
	readonly type: FieldManifest<this["Target"]>;
}

interface ReplicantFieldEffectLambda extends HKT.TypeLambda {
	readonly type: ReplicantFieldEffect<this["Target"]>;
}

interface ReplicantFieldPromiseLambda extends HKT.TypeLambda {
	readonly type: ReplicantField<this["Target"]>;
}

interface ComputedFieldEffectLambda extends HKT.TypeLambda {
	readonly type: ComputedFieldEffect<this["Target"]>;
}

interface ComputedFieldPromiseLambda extends HKT.TypeLambda {
	readonly type: ComputedField<this["Target"]>;
}

interface TopicFieldEffectLambda extends HKT.TypeLambda {
	readonly type: TopicFieldEffect<this["Target"]>;
}

interface TopicFieldPromiseLambda extends HKT.TypeLambda {
	readonly type: TopicField<this["Target"]>;
}

interface RpcFieldManifestLambda extends HKT.TypeLambda {
	readonly Target: WidestRpcField;
	readonly type: RpcFieldManifest<
		this["Target"]["request"],
		this["Target"]["response"]
	>;
}

interface RpcFieldEffectLambda extends HKT.TypeLambda {
	readonly Target: WidestRpcField;
	readonly type: RpcFieldEffect<
		this["Target"]["request"],
		this["Target"]["response"]
	>;
}

interface RpcFieldPromiseLambda extends HKT.TypeLambda {
	readonly Target: WidestRpcField;
	readonly type: RpcField<
		this["Target"]["request"],
		this["Target"]["response"]
	>;
}

export class DuplicateNamespace extends Schema.TaggedError<DuplicateNamespace>()(
	"DuplicateNamespace",
	{ namespace: Schema.String },
) {
	override readonly message = `Namespace "${this.namespace}" was loaded twice`;
}

class ReportedError extends Schema.TaggedError<ReportedError>()(
	"ReportedError",
	{ cause: Schema.Defect() },
) {
	override readonly message = String(this.cause);
}

const buildFields = <
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
>(
	manifest: NamespaceManifest<string, S, string, CustomRoutes>,
	baseUrl: string | undefined,
) =>
	Layer.build(Layer.merge(FieldCellsService.layer, Path.layer)).pipe(
		Effect.flatMap((context) =>
			Effect.gen(function* () {
				const base = baseUrl
					? Option.some(yield* Effect.fromResult(Url.fromString(baseUrl)))
					: Option.none();
				const replicant = yield* mapEffectValues<
					FieldManifestLambda,
					ReplicantFieldEffectLambda
				>()((codec, name) =>
					implementReplicant(manifest.namespace, name, codec),
				)(manifest.replicant);
				const computed = yield* mapEffectValues<
					FieldManifestLambda,
					ComputedFieldEffectLambda
				>()((codec, name) =>
					implementComputed(manifest.namespace, name, codec),
				)(manifest.computed);
				const topic = yield* mapEffectValues<
					FieldManifestLambda,
					TopicFieldEffectLambda
				>()((codec, name) => implementTopic(manifest.namespace, name, codec))(
					manifest.topic,
				);
				const rpc = yield* mapEffectValues<
					RpcFieldManifestLambda,
					RpcFieldEffectLambda
				>()((codec, name) => implementRpc(manifest.namespace, name, codec))(
					manifest.rpc,
				);
				const customRoute = yield* mapEffectValues<
					CustomRouteManifestLambda,
					CustomRouteLambda
				>()((_, name) => implementCustomRoute(base, manifest.namespace, name))(
					manifest.customRoute,
				);
				return {
					namespace: manifest.namespace,
					replicant,
					computed,
					topic,
					rpc,
					customRoute,
				};
			}).pipe(Effect.provide(context)),
		),
	);

type TreeManifest<
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
> = NamespaceManifest<string, S, string, CustomRoutes> & {
	readonly children: ApplyLambdaToObjectValues<
		TreeManifestLambda,
		S["children"]
	>;
};

interface TreeManifestLambda extends HKT.TypeLambda {
	readonly type: TreeManifest<
		InferNamespace<this["Target"]>["fields"],
		InferNamespace<this["Target"]>["customRoutes"]
	>;
}

interface WidenedManifest {
	readonly namespace: string;
	readonly children: Readonly<Record<string, WidenedManifest>>;
}

type BuiltFields<
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
> = Effect.Success<ReturnType<typeof buildFields<S, CustomRoutes>>>;

type BuiltNamespace<
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
> = BuiltFields<S, CustomRoutes> & {
	readonly children: ApplyLambdaToObjectValues<
		BuiltNamespaceLambda,
		S["children"]
	>;
};

interface NamespaceHandles<
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
> {
	readonly built: BuiltNamespace<S, CustomRoutes>;
	readonly loaded: LoadedNamespace<S, CustomRoutes>;
}

interface NamespaceHandlesLambda extends HKT.TypeLambda {
	readonly type: NamespaceHandles<
		InferNamespace<this["Target"]>["fields"],
		InferNamespace<this["Target"]>["customRoutes"]
	>;
}

interface BuiltNamespaceLambda extends HKT.TypeLambda {
	readonly type: BuiltNamespace<
		InferNamespace<this["Target"]>["fields"],
		InferNamespace<this["Target"]>["customRoutes"]
	>;
}

interface LoadedNamespaceLambda extends HKT.TypeLambda {
	readonly type: LoadedNamespace<
		InferNamespace<this["Target"]>["fields"],
		InferNamespace<this["Target"]>["customRoutes"]
	>;
}

const loadTree = Effect.fn("loadNamespace")(function* <
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
>(manifest: TreeManifest<S, CustomRoutes>, baseUrl: string | undefined) {
	const manifests = new Set<WidenedManifest>();
	const walk = (node: WidenedManifest) => {
		if (manifests.has(node)) {
			return;
		}
		manifests.add(node);
		for (const child of Object.values(node.children)) {
			walk(child);
		}
	};
	walk(manifest);

	const names = new Set<string>();
	for (const { namespace } of manifests) {
		if (names.has(namespace)) {
			return yield* DuplicateNamespace.make({ namespace });
		}
		names.add(namespace);
	}

	const services = yield* Effect.context<never>().pipe(
		Effect.map(Context.omit(Tracer.ParentSpan)),
	);
	const runSubscription = yield* FiberSet.makeRuntime().pipe(
		Effect.updateContext<Scope.Scope, Scope.Scope>(
			Context.omit(Tracer.ParentSpan),
		),
	);
	const builtHandles = new WeakMap<WidenedManifest, unknown>();
	const build = <
		TreeS extends WidestNamespaceFields,
		TreeCustomRoutes extends WidestCustomRoutes,
	>(
		node: TreeManifest<TreeS, TreeCustomRoutes>,
	): Effect.Effect<
		NamespaceHandles<TreeS, TreeCustomRoutes>,
		Effect.Error<ReturnType<typeof buildFields>>,
		Effect.Services<ReturnType<typeof buildFields>>
	> =>
		Effect.gen(function* () {
			// Reuse when namespace is referenced by multiple parents
			const existing = builtHandles.get(node);
			if (typeof existing !== "undefined") {
				return existing as NamespaceHandles<TreeS, TreeCustomRoutes>;
			}
			const children = yield* mapEffectValues<
				TreeManifestLambda,
				NamespaceHandlesLambda
			>()((child) => build(child))<TreeS["children"]>(node.children);
			const fields = yield* buildFields(node, baseUrl);
			const handles: NamespaceHandles<TreeS, TreeCustomRoutes> = {
				built: {
					...fields,
					children: mapValues<NamespaceHandlesLambda, BuiltNamespaceLambda>(
						(child) => child.built,
					)(children),
				},
				loaded: adaptNamespace(
					services,
					runSubscription,
					fields,
					mapValues<NamespaceHandlesLambda, LoadedNamespaceLambda>(
						(child) => child.loaded,
					)(children),
				),
			};
			builtHandles.set(node, handles);
			return handles;
		});

	const root = yield* build(manifest);
	const auth = yield* makeAuthClient(baseUrl);
	return { root, auth };
});

export const loadNamespaceEffect = Effect.fnUntraced(function* <
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
>(
	manifest: TreeManifest<S, CustomRoutes>,
	options?: { readonly baseUrl?: string },
) {
	const telemetry = yield* Layer.build(otlpTelemetry(options?.baseUrl));
	const {
		root: { built },
		auth,
	} = yield* loadTree(manifest, options?.baseUrl).pipe(
		Effect.provide(telemetry),
	);
	return {
		namespace: built.namespace,
		replicant: built.replicant,
		computed: built.computed,
		topic: built.topic,
		rpc: built.rpc,
		customRoute: built.customRoute,
		children: built.children,
		auth,
	};
});

const adaptNamespace = <
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
>(
	services: Context.Context<never>,
	runSubscription: (subscription: Effect.Effect<void>) => Fiber.Fiber<void>,
	fields: BuiltFields<S, CustomRoutes>,
	children: LoadedNamespace<S, CustomRoutes>["children"],
) => {
	const runPromise = Effect.runPromiseWith(services);
	const runFork = Effect.runForkWith(services);

	const subscribeEffectToPromise =
		<Decoded>(
			subscribe: () => Effect.Effect<
				Stream.Stream<Result.Result<Decoded, FieldFailure>>,
				never,
				Scope.Scope
			>,
			name: string,
		) =>
		(
			callback: (value: Decoded) => Promisable<void>,
			onError?: (error: FieldFailure) => void,
		) => {
			const fiber = runSubscription(
				subscribe().pipe(
					Effect.flatMap(
						Stream.runForEach((element) =>
							element.pipe(
								Result.match({
									onSuccess: (value) =>
										Effect.tryPromise(async () => callback(value)),
									onFailure: (error) =>
										Effect.logError(
											`Subscription to "${name}" in "${fields.namespace}" failed`,
											error,
										).pipe(Effect.andThen(Effect.try(() => onError?.(error)))),
								}),
								Effect.catchTag("UnknownError", (error) =>
									Effect.logError(
										`Subscription handler for "${name}" in "${fields.namespace}" threw`,
										error,
									),
								),
							),
						),
					),
					Effect.scoped,
				),
			);
			return () => {
				runFork(Fiber.interrupt(fiber));
			};
		};

	const replicant = mapValues<
		ReplicantFieldEffectLambda,
		ReplicantFieldPromiseLambda
	>((field, name) => ({
		get: () => runPromise(field.get()),
		set: (value) => runPromise(field.set(value)),
		update: (fn, options) => runPromise(field.update(fn, options)),
		subscribe: (callback, onError) =>
			subscribeEffectToPromise(
				() => field.subscribe().pipe(Effect.map(zipPreviousSuccess)),
				name,
			)(
				([oldValue, value]) => callback(value, Option.getOrUndefined(oldValue)),
				onError,
			),
		[fieldSource]: field[fieldSource],
	}))(fields.replicant);

	const computed = mapValues<
		ComputedFieldEffectLambda,
		ComputedFieldPromiseLambda
	>((field, name) => ({
		get: () => runPromise(field.get()),
		subscribe: (callback, onError) =>
			subscribeEffectToPromise(
				() => field.subscribe().pipe(Effect.map(zipPreviousSuccess)),
				name,
			)(
				([oldValue, value]) => callback(value, Option.getOrUndefined(oldValue)),
				onError,
			),
		[fieldSource]: field[fieldSource],
	}))(fields.computed);

	const topic = mapValues<TopicFieldEffectLambda, TopicFieldPromiseLambda>(
		(field, name) => ({
			publish: (value) => runPromise(field.publish(value)),
			subscribe: subscribeEffectToPromise(field.subscribe, name),
		}),
	)(fields.topic);

	const rpc = mapValues<RpcFieldEffectLambda, RpcFieldPromiseLambda>(
		(field) => ({
			call: (request) => runPromise(field.call(request)),
		}),
	)(fields.rpc);

	return {
		replicant,
		computed,
		topic,
		rpc,
		customRoute: fields.customRoute,
		children,
	};
};

export interface LoadedNamespace<
	S extends WidestNamespaceFields = WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes = WidestCustomRoutes,
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
	readonly customRoute: {
		readonly [R in keyof CustomRoutes & string]: CustomRoute;
	};
	readonly children: {
		readonly [K in keyof S["children"] & string]: LoadedNamespace<
			InferNamespace<S["children"][K]>["fields"],
			InferNamespace<S["children"][K]>["customRoutes"]
		>;
	};
}

export type LoadedRoot<
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
> = LoadedNamespace<S, CustomRoutes> & {
	readonly auth: ReturnType<typeof adaptAuthClient>;
	readonly reportError: (error: unknown) => void;
	readonly dispose: () => void;
};

/**
 * Client-side entrypoint loading a namespace and its children over one connection
 */
export async function loadNamespace<
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
>(
	manifest: TreeManifest<S, CustomRoutes>,
	options?: {
		baseUrl?: string;
		fieldTransport?:
			| (() => FieldTransport)
			| Effect.Effect<FieldTransport, never, never>;
		messageChannel?:
			| (() => MessageChannel)
			| Effect.Effect<MessageChannel, never, never>;
	},
): Promise<LoadedRoot<S, CustomRoutes>> {
	const baseUrl = options?.baseUrl;
	const fieldTransport = options?.fieldTransport;
	const messageChannel = options?.messageChannel;

	const transportLayer = fieldTransport
		? Effect.isEffect(fieldTransport)
			? Layer.effect(FieldTransportService, fieldTransport)
			: Layer.sync(FieldTransportService, fieldTransport)
		: httpFieldTransport(baseUrl);

	const messageChannelLayer = messageChannel
		? Effect.isEffect(messageChannel)
			? Layer.effect(MessageChannelService, messageChannel)
			: Layer.sync(MessageChannelService, messageChannel)
		: webSocketMessageChannel(baseUrl);

	const runtime = ManagedRuntime.make(
		Layer.mergeAll(
			transportLayer,
			messageChannelLayer,
			FetchHttpClient.layer,
			otlpTelemetry(baseUrl),
		).pipe(Layer.provide(Path.layer)),
	);

	const { root, auth } = await runtime.runPromise(
		loadTree(manifest, baseUrl).pipe(
			Scope.provide(runtime.scope),
			Effect.onError(() => runtime.disposeEffect),
		),
	);
	const { replicant, computed, topic, rpc, customRoute, children } =
		root.loaded;

	return {
		replicant,
		computed,
		topic,
		rpc,
		customRoute,
		children,
		auth: adaptAuthClient(runtime, Effect.succeed(auth)),
		reportError: (error) => {
			runtime.runFork(
				ReportedError.make({ cause: error }).pipe(
					Effect.withSpan("reportError"),
					Effect.exit,
				),
			);
		},
		dispose: runtime.dispose,
	};
}
