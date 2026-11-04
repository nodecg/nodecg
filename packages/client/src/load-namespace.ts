import type {
	CustomRouteManifest,
	NamespaceManifest,
	FieldManifest,
	RpcFieldManifest,
	EmptyNamespaceFields,
	WidestCustomRoutes,
	WidestNamespaceFields,
	WidestRpcField,
} from "@nodecg-next/core";
import { customRoutePath, type Updater } from "@nodecg-next/internal";
import { diffSignedPatch } from "@nodecg-next/internal/occ";
import {
	mapEffectValues,
	mapValues,
	toError,
	type EffectToPromiseLambda,
	type StreamToSubscribeTopicLambda,
	type StreamToSubscribeLambda,
	type ApplyLambdaToObject,
} from "@nodecg-next/internal/utils";
import { effect } from "@preact/signals-core";
import {
	Array,
	Cause,
	Deferred,
	Effect,
	Exit,
	type HKT,
	Layer,
	ManagedRuntime,
	Match,
	Option,
	Path,
	Queue,
	Ref,
	type Schema,
	Scope,
	Stream,
} from "effect";
import { FetchHttpClient, Url } from "effect/http";
import type { Promisable } from "type-fest";

import { type FieldSource, fieldSource } from "./derive.ts";
import {
	type ComputedCell,
	FieldCellsService,
	type FieldFailure,
	type ReplicantCell,
	type TerminalFieldFailure,
	type TopicCell,
} from "./field-cells.ts";
import { Loadable } from "./loadable.ts";
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
	cell: ReplicantCell<Decoded> | ComputedCell<Decoded>,
) {
	const queue = yield* Queue.make<Decoded, TerminalFieldFailure>();
	const ready = yield* Deferred.make<void, FieldFailure>();
	yield* Effect.acquireRelease(
		Effect.sync(() => {
			let settled = false;
			return effect(() => {
				Match.value(cell.signal.value).pipe(
					Match.tag("Ready", ({ value }) => {
						settled = true;
						Queue.offerUnsafe(queue, value.decoded);
						Deferred.doneUnsafe(ready, Effect.void);
					}),
					Match.tag("Failure", ({ error }) => {
						if (!settled) {
							Deferred.doneUnsafe(ready, Effect.fail(error));
							return;
						}
						Match.value(error).pipe(
							Match.tag("FieldUnavailable", () => {}),
							Match.tag(
								"FieldNotFound",
								"FieldPermissionDenied",
								(terminal) => {
									Queue.failCauseUnsafe(queue, Cause.fail(terminal));
								},
							),
							Match.exhaustive,
						);
					}),
					Match.tag("Cold", () => {}),
					Match.tag("Pending", () => {}),
					Match.exhaustive,
				);
			});
		}),
		(dispose) => Effect.sync(dispose),
	);
	yield* Deferred.await(ready);
	return Stream.fromQueue(queue);
});

// Topic doesn't have to wait for first value
const subscribeTopicCell = Effect.fn(function* <Decoded>(
	cell: TopicCell<Decoded>,
) {
	const queue = yield* Queue.make<Decoded, TerminalFieldFailure>();
	yield* Effect.acquireRelease(
		Effect.sync(() => {
			let initial = true;
			return effect(() => {
				Match.value(cell.signal.value).pipe(
					Match.tag("Ready", ({ value }) => {
						if (!initial) {
							Queue.offerUnsafe(queue, value.decoded);
						}
					}),
					Match.tag("Failure", ({ error }) => {
						Match.value(error).pipe(
							Match.tag("FieldUnavailable", () => {}),
							Match.tag(
								"FieldNotFound",
								"FieldPermissionDenied",
								(terminal) => {
									Queue.failCauseUnsafe(queue, Cause.fail(terminal));
								},
							),
							Match.exhaustive,
						);
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
				new FieldSetError({ namespace, name, cause: toError(error) }),
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

	const subscribe = () => subscribeCell(cell);

	return { get, set, update, subscribe, [fieldSource]: cell.signal };
});

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

	const subscribe = () => subscribeCell(cell);

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

	const subscribe = () => subscribeTopicCell(cell);

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

const buildNamespace = <
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
				const fields = yield* mapEffectValues<
					FieldManifestLambda,
					ReplicantFieldEffectLambda
				>()((codec, name) =>
					implementReplicant(manifest.namespace, name, codec),
				)(manifest.replicant);
				const computedFields = yield* mapEffectValues<
					FieldManifestLambda,
					ComputedFieldEffectLambda
				>()((codec, name) =>
					implementComputed(manifest.namespace, name, codec),
				)(manifest.computed);
				const topicFields = yield* mapEffectValues<
					FieldManifestLambda,
					TopicFieldEffectLambda
				>()((codec, name) => implementTopic(manifest.namespace, name, codec))(
					manifest.topic,
				);
				const rpcFields = yield* mapEffectValues<
					RpcFieldManifestLambda,
					RpcFieldEffectLambda
				>()((codec, name) => implementRpc(manifest.namespace, name, codec))(
					manifest.rpc,
				);
				const customRoutes = yield* mapEffectValues<
					CustomRouteManifestLambda,
					CustomRouteLambda
				>()((_, name) => implementCustomRoute(base, manifest.namespace, name))(
					manifest.customRoute,
				);
				return {
					fields,
					computedFields,
					topicFields,
					rpcFields,
					customRoutes,
				};
			}).pipe(Effect.provide(context)),
		),
	);

export const loadNamespaceEffect = Effect.fn("loadNamespaceEffect")(function* <
	S extends WidestNamespaceFields = EmptyNamespaceFields,
	CustomRoutes extends WidestCustomRoutes = {},
>(
	manifest: NamespaceManifest<string, S, string, CustomRoutes>,
	options?: { readonly baseUrl?: string },
) {
	return yield* buildNamespace(manifest, options?.baseUrl).pipe(
		Effect.map(
			({ fields, computedFields, topicFields, rpcFields, customRoutes }) => ({
				namespace: manifest.namespace,
				replicant: fields,
				computed: computedFields,
				topic: topicFields,
				rpc: rpcFields,
				customRoute: customRoutes,
			}),
		),
	);
});

export interface BuiltNamespace<
	S extends WidestNamespaceFields = WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes = WidestCustomRoutes,
> extends Effect.Success<
	ReturnType<typeof loadNamespaceEffect<S, CustomRoutes>>
> {}

export const adaptNamespace = <
	S extends WidestNamespaceFields,
	CustomRoutes extends WidestCustomRoutes,
	R,
	E,
>(
	runtime: ManagedRuntime.ManagedRuntime<R, E>,
	built: BuiltNamespace<S, CustomRoutes>,
) => {
	const subscribeEffectToPromise =
		<Decoded, SubscribeError>(
			subscribe: () => Effect.Effect<
				Stream.Stream<Decoded, TerminalFieldFailure>,
				SubscribeError,
				Scope.Scope
			>,
			name: string,
			awaitSeed: boolean,
		) =>
		async (
			callback: (value: Decoded) => Promisable<void>,
			onError?: (error: TerminalFieldFailure) => void,
		) =>
			runtime.runPromise(
				Effect.gen(function* () {
					const scope = yield* Scope.make();
					const stream = yield* subscribe().pipe(
						Scope.provide(scope),
						Effect.onError(() => Scope.close(scope, Exit.void)),
					);
					const seeded = yield* Deferred.make<void>();
					yield* stream.pipe(
						Stream.runForEach((value) =>
							Effect.tryPromise(async () => callback(value)).pipe(
								Effect.catchTag("UnknownError", (error) =>
									Effect.logError(
										`Subscription handler for "${built.namespace}/${name}" threw`,
										error,
									),
								),
								Effect.tap(() => Deferred.succeed(seeded, undefined)),
							),
						),
						Effect.catchTag(
							["FieldNotFound", "FieldPermissionDenied"],
							(error) => Effect.sync(() => onError?.(error)),
						),
						Effect.forkIn(scope),
					);
					if (awaitSeed) {
						yield* Deferred.await(seeded);
					}
					return () => runtime.runPromise(Scope.close(scope, Exit.void));
				}),
			);

	const replicant = mapValues<
		ReplicantFieldEffectLambda,
		ReplicantFieldPromiseLambda
	>((field, name) => ({
		get: () => runtime.runPromise(field.get()),
		set: (value) => runtime.runPromise(field.set(value)),
		update: (fn, options) => runtime.runPromise(field.update(fn, options)),
		subscribe: (callback, onError) =>
			subscribeEffectToPromise(
				() => field.subscribe().pipe(Effect.map(Stream.zipWithPrevious)),
				name,
				true,
			)(
				([oldValue, value]) => callback(value, Option.getOrUndefined(oldValue)),
				onError,
			),
		[fieldSource]: field[fieldSource],
	}))(built.replicant);

	const computed = mapValues<
		ComputedFieldEffectLambda,
		ComputedFieldPromiseLambda
	>((field, name) => ({
		get: () => runtime.runPromise(field.get()),
		subscribe: (callback, onError) =>
			subscribeEffectToPromise(
				() => field.subscribe().pipe(Effect.map(Stream.zipWithPrevious)),
				name,
				true,
			)(
				([oldValue, value]) => callback(value, Option.getOrUndefined(oldValue)),
				onError,
			),
		[fieldSource]: field[fieldSource],
	}))(built.computed);

	const topic = mapValues<TopicFieldEffectLambda, TopicFieldPromiseLambda>(
		(field, name) => ({
			publish: (value) => runtime.runPromise(field.publish(value)),
			subscribe: subscribeEffectToPromise(field.subscribe, name, false),
		}),
	)(built.topic);

	const rpc = mapValues<RpcFieldEffectLambda, RpcFieldPromiseLambda>(
		(field) => ({
			call: (request) => runtime.runPromise(field.call(request)),
		}),
	)(built.rpc);

	return { replicant, computed, topic, rpc, customRoute: built.customRoute };
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
	readonly dispose: () => void;
}

/**
 * Client-side entrypoint of namespace manifests returned from defineNamespace
 */
export async function loadNamespace<
	S extends WidestNamespaceFields = EmptyNamespaceFields,
	CustomRoutes extends WidestCustomRoutes = {},
>(
	manifest: NamespaceManifest<string, S, string, CustomRoutes>,
	options?: {
		baseUrl?: string;
		fieldTransport?:
			| (() => FieldTransport)
			| Effect.Effect<FieldTransport, never, never>;
		messageChannel?:
			| (() => MessageChannel)
			| Effect.Effect<MessageChannel, never, never>;
	},
): Promise<LoadedNamespace<S, CustomRoutes>> {
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
		).pipe(Layer.provide(Path.layer)),
	);

	const built = await runtime.runPromise(
		loadNamespaceEffect(manifest, { baseUrl }).pipe(
			Scope.provide(runtime.scope),
			Effect.onError(() => runtime.disposeEffect),
		),
	);
	const { replicant, computed, topic, rpc, customRoute } = adaptNamespace(
		runtime,
		built,
	);

	return {
		replicant,
		computed,
		topic,
		rpc,
		customRoute,
		dispose: runtime.dispose,
	};
}
