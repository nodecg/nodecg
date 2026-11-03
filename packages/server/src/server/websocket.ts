import type { FieldEncodeError } from "@nodecg-next/core";
import {
	ClientMessage,
	type ComputedFieldIdentifier,
	type FieldIdentifier,
	FieldValueMessage,
	type Identity,
	PongMessage,
	ReplicantDeltaMessage,
	type ReplicantFieldIdentifier,
	ReplicantSnapshotMessage,
	ServerMessage,
	SubscribeRejectedMessage,
	type TopicFieldIdentifier,
} from "@nodecg-next/internal";
import {
	Context,
	Data,
	Effect,
	Fiber,
	HashMap,
	Match,
	Option,
	Schema,
	Stream,
	SynchronizedRef,
} from "effect";
import { HttpRouter, HttpServerRequest, HttpServerResponse } from "effect/http";
import type { Socket } from "effect/socket";

import {
	getSessionIdentity,
	readBearerToken,
	readSessionToken,
	resolveServiceAccountCaller,
	resolveSessionCaller,
} from "../auth/identity.ts";
import type { FieldPermissionDenied } from "../field-builders/permission.ts";
import {
	type ComputedFieldInternal,
	NamespaceRegistryService,
	type ReplicantFieldInternal,
	type TopicFieldInternal,
} from "../namespace-registry.ts";
import {
	type ComputedComputeError,
	type ComputedNotFound,
	ReplicantStoreService,
	type ReplicantFrame,
	type UnknownReplicant,
} from "../replicant-store.ts";
import { config } from "../server-config.ts";
import type { ReplicantNotFound } from "../services/repository/replicant/replicant-repository.ts";
import { TopicBrokerService } from "../services/topic-broker/topic-broker.ts";

const decodeClientMessage = Schema.decodeEffect(
	Schema.fromJsonString(ClientMessage),
);
const encodeServerMessage = Schema.encodeEffect(
	Schema.fromJsonString(ServerMessage),
);
type SubscribeFailure =
	| FieldPermissionDenied
	| ComputedComputeError
	| ReplicantNotFound
	| UnknownReplicant
	| FieldEncodeError
	| ComputedNotFound
	| Schema.SchemaError
	| Socket.SocketError;

type ResolvedField = Data.TaggedEnum<{
	Replicant: {
		readonly field: ReplicantFieldIdentifier;
		readonly internal: ReplicantFieldInternal;
	};
	Computed: {
		readonly field: ComputedFieldIdentifier;
		readonly internal: ComputedFieldInternal;
	};
	Topic: {
		readonly field: TopicFieldIdentifier;
		readonly internal: TopicFieldInternal;
	};
}>;
const ResolvedField = Data.taggedEnum<ResolvedField>();

export const websocketRoute = HttpRouter.use((router) =>
	Effect.gen(function* () {
		const registry = yield* NamespaceRegistryService;

		const resolveField = (field: FieldIdentifier) =>
			Match.value(field).pipe(
				Match.when({ type: "replicant" }, (replicantField) =>
					Option.fromNullishOr(
						registry.replicant
							.get(replicantField.namespace)
							?.get(replicantField.name),
					).pipe(
						Option.map((internal) =>
							ResolvedField.Replicant({ field: replicantField, internal }),
						),
					),
				),
				Match.when({ type: "computed" }, (computedField) =>
					Option.fromNullishOr(
						registry.computed
							.get(computedField.namespace)
							?.get(computedField.name),
					).pipe(
						Option.map((internal) =>
							ResolvedField.Computed({ field: computedField, internal }),
						),
					),
				),
				Match.when({ type: "topic" }, (topicField) =>
					Option.fromNullishOr(
						registry.topic.get(topicField.namespace)?.get(topicField.name),
					).pipe(
						Option.map((internal) =>
							ResolvedField.Topic({ field: topicField, internal }),
						),
					),
				),
				Match.exhaustive,
			);

		const wsHandler = Effect.fn(function* (identity: Identity) {
			const request = yield* HttpServerRequest.HttpServerRequest;
			const socket = yield* request.upgrade;
			const { write } = yield* socket.writer;

			const send = (msg: ServerMessage) =>
				encodeServerMessage(msg).pipe(
					Effect.andThen((encodedMessage) => write(encodedMessage)),
				);

			const rejectSubscribeFailure = (field: FieldIdentifier) => {
				const rejectUnavailable = (error: { readonly message: string }) =>
					send(
						SubscribeRejectedMessage.make({
							field,
							reason: "unavailable",
							message: error.message,
						}),
					);
				return <A, R>(effect: Effect.Effect<A, SubscribeFailure, R>) =>
					effect.pipe(
						Effect.catchTags({
							FieldPermissionDenied: () =>
								send(
									SubscribeRejectedMessage.make({ field, reason: "forbidden" }),
								),
							ComputedComputeError: rejectUnavailable,
							ReplicantNotFound: rejectUnavailable,
							UnknownReplicant: rejectUnavailable,
							FieldEncodeError: rejectUnavailable,
							ComputedNotFound: () =>
								send(
									SubscribeRejectedMessage.make({ field, reason: "not-found" }),
								),
						}),
					);
			};

			const replicantFrameMessage = (
				field: ReplicantFieldIdentifier,
				frame: ReplicantFrame,
			) =>
				Option.match(frame.delta, {
					onNone: () =>
						ReplicantSnapshotMessage.make({
							field,
							value: frame.value,
							revision: frame.revision,
						}),
					onSome: (delta) =>
						ReplicantDeltaMessage.make({
							field,
							ops: delta.ops,
							baseRevision: delta.baseRevision,
							revision: frame.revision,
							hash: delta.hash,
						}),
				});

			const openSubscription = Effect.fn("openSubscription")(function* (
				field: FieldIdentifier,
			) {
				const resolved = resolveField(field);
				if (Option.isNone(resolved)) {
					yield* send(
						SubscribeRejectedMessage.make({ field, reason: "not-found" }),
					);
					return Option.none();
				}
				const target = resolved.value;
				if (!target.internal.permission.canRead(identity)) {
					yield* send(
						SubscribeRejectedMessage.make({ field, reason: "forbidden" }),
					);
					return Option.none();
				}

				const fiber = yield* Effect.forkScoped(
					Match.value(target).pipe(
						Match.tag("Replicant", ({ field, internal }) =>
							Effect.gen(function* () {
								const frames = yield* internal.subscribeRevisioned();
								yield* Stream.runForEach(frames, (frame) =>
									send(replicantFrameMessage(field, frame)),
								);
							}),
						),
						Match.tag("Computed", "Topic", ({ field, internal }) =>
							Effect.gen(function* () {
								const stream = yield* internal.subscribeEncoded();
								yield* Stream.runForEach(stream, (value) =>
									send(FieldValueMessage.make({ field, value })),
								);
							}),
						),
						Match.exhaustive,
						Effect.scoped,
						rejectSubscribeFailure(field),
					),
				);
				return Option.some(fiber);
			});

			const subscriptions = yield* SynchronizedRef.make(
				HashMap.empty<
					FieldIdentifier,
					Fiber.Fiber<void, Schema.SchemaError | Socket.SocketError>
				>(),
			);

			const handleData = Effect.fn(function* (data: string | Uint8Array) {
				if (typeof data !== "string") {
					return;
				}
				const message = yield* decodeClientMessage(data).pipe(
					Effect.asSome,
					Effect.catchTag("SchemaError", (error) =>
						Effect.logError("Failed to decode incoming message:", error).pipe(
							Effect.as(Option.none()),
						),
					),
				);
				if (Option.isNone(message)) {
					return;
				}
				yield* Match.value(message.value).pipe(
					Match.tag("ping", () =>
						Effect.gen(function* () {
							yield* Effect.logDebug("Received ping");
							yield* send(PongMessage.make({}));
						}),
					),
					Match.tag("subscribe", (msg) =>
						SynchronizedRef.updateEffect(subscriptions, (map) =>
							Effect.gen(function* () {
								const existing = HashMap.get(map, msg.field);
								// Restart subscription for fresh reseed if already running
								if (Option.isSome(existing)) {
									yield* Fiber.interrupt(existing.value);
								}
								const fiber = yield* openSubscription(msg.field);
								return HashMap.modifyAt(map, msg.field, () => fiber);
							}),
						),
					),
					Match.tag("resync", (msg) =>
						SynchronizedRef.updateEffect(subscriptions, (map) =>
							Effect.gen(function* () {
								const existing = HashMap.get(map, msg.field);
								// Ignore if not subscribed
								if (Option.isNone(existing)) {
									return map;
								}
								yield* Fiber.interrupt(existing.value);
								const fiber = yield* openSubscription(msg.field);
								return HashMap.modifyAt(map, msg.field, () => fiber);
							}),
						),
					),
					Match.tag("unsubscribe", (msg) =>
						SynchronizedRef.updateEffect(subscriptions, (map) =>
							Effect.gen(function* () {
								const existing = HashMap.get(map, msg.field);
								if (Option.isNone(existing)) {
									return map;
								}
								yield* Fiber.interrupt(existing.value);
								return HashMap.remove(map, msg.field);
							}),
						),
					),
					Match.exhaustive,
				);
			});

			const { pull } = yield* socket.reader;
			return yield* pull.pipe(
				Effect.flatMap(
					Effect.forEach((data) => handleData(data), { discard: true }),
				),
				Effect.forever,
				Effect.catchReason("SocketError", "SocketCloseError", () =>
					Effect.succeed(HttpServerResponse.empty()),
				),
			);
		});

		const requireAuth = yield* config.requireAuth;
		const context = yield* Effect.context<
			TopicBrokerService | ReplicantStoreService
		>().pipe(
			Effect.map(Context.pick(TopicBrokerService, ReplicantStoreService)),
		);

		yield* router.add(
			"GET",
			"/ws/internal",
			Effect.gen(function* () {
				const caller = yield* resolveSessionCaller(yield* readSessionToken);
				if (Option.isNone(caller) && requireAuth) {
					return HttpServerResponse.empty({ status: 401 });
				}
				return yield* wsHandler(getSessionIdentity(caller)).pipe(
					Effect.provide(context),
				);
			}),
		);

		yield* router.add(
			"GET",
			"/ws/v0",
			Effect.gen(function* () {
				const caller = yield* resolveServiceAccountCaller(
					yield* readBearerToken,
				);
				if (Option.isNone(caller)) {
					return HttpServerResponse.empty({ status: 401 });
				}
				return yield* wsHandler(caller.value).pipe(Effect.provide(context));
			}),
		);
	}),
);
