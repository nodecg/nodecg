import type { FieldDecodeError, FieldManifest } from "@nodecg/core";
import {
	ClientMessage,
	type ComputedFieldIdentifier,
	type FieldIdentifier,
	type FieldValueMessage,
	type PublishMessage,
	type ReplicantDeltaMessage,
	type ReplicantFieldIdentifier,
	type ReplicantSnapshotMessage,
	ResyncMessage,
	SubscribeMessage,
	type TopicFieldIdentifier,
	UnsubscribeMessage,
} from "@nodecg/internal";
import { applyPatch, computeFingerprint } from "@nodecg/internal/occ";
import { setSignal, type SetSignalError } from "@nodecg/internal/utils";
import { type Signal, signal } from "@preact/signals-core";
import {
	Context,
	Effect,
	HashSet,
	Layer,
	Match,
	MutableHashMap,
	Option,
	Queue,
	Ref,
	Result,
	Schema,
	Stream,
	Tracer,
} from "effect";

import {
	Cold,
	type ComputedLoadable,
	type ComputedValue,
	Loadable,
	ReadyLoadableValue,
	Pending,
	type ReplicantLoadable,
	type ReplicantValue,
	type TopicLoadable,
	type TopicValue,
} from "./loadable.ts";
import {
	FieldNotFound,
	FieldPermissionDenied,
	FieldUnavailable,
} from "./services/field-transport/field-transport.ts";
import {
	ConnectionStatus,
	MessageChannelService,
} from "./services/message-channel/message-channel.ts";

export type TerminalFieldFailure = FieldNotFound | FieldPermissionDenied;
export type FieldFailure = TerminalFieldFailure | FieldUnavailable;

const isCold = Loadable.$is("Cold");
const isConnectionStatus = Schema.is(ConnectionStatus);
const isClientMessage = Schema.is(ClientMessage);

export interface ReplicantCell<Decoded> {
	readonly signal: Signal<ReplicantLoadable<Decoded, FieldFailure>>;
	readonly peek: () => ReplicantLoadable<Decoded, FieldFailure>;
}

export interface ComputedCell<Decoded> {
	readonly signal: Signal<ComputedLoadable<Decoded, FieldFailure>>;
	readonly peek: () => ComputedLoadable<Decoded, FieldFailure>;
}

export interface TopicCell<Decoded> {
	readonly signal: Signal<TopicLoadable<Decoded, FieldFailure>>;
	readonly peek: () => TopicLoadable<Decoded, FieldFailure>;
}

// Forks two fibers: sender (client -> server) and pump (server -> client), both interrupted when the scope closes.
export class FieldCellsService extends Context.Service<FieldCellsService>()(
	"FieldCells",
	{
		make: Effect.gen(function* () {
			const channel = yield* MessageChannelService;
			const outbound = yield* Queue.unbounded<ClientMessage>();

			interface CellHandlers<Message> {
				readonly applyFrame: (
					frame: Message,
				) => Effect.Effect<void, SetSignalError>;
				readonly reject: (
					reason: "forbidden" | "not-found" | "unavailable",
					message: string | undefined,
				) => Result.Result<void, SetSignalError>;
			}

			type ReplicantPublish = ReplicantSnapshotMessage | ReplicantDeltaMessage;
			const replicantHandlers = MutableHashMap.empty<
				ReplicantFieldIdentifier,
				CellHandlers<ReplicantPublish>
			>();

			const computedHandlers = MutableHashMap.empty<
				ComputedFieldIdentifier,
				CellHandlers<FieldValueMessage>
			>();

			const topicHandlers = MutableHashMap.empty<
				TopicFieldIdentifier,
				CellHandlers<FieldValueMessage>
			>();

			const makeRejectionError = (
				namespace: string,
				name: string,
				reason: "forbidden" | "not-found" | "unavailable",
				message: string | undefined,
			) =>
				Match.value(reason).pipe(
					Match.when("not-found", () => new FieldNotFound({ namespace, name })),
					Match.when(
						"forbidden",
						() => new FieldPermissionDenied({ namespace, name }),
					),
					Match.when(
						"unavailable",
						() => new FieldUnavailable({ namespace, name, detail: message }),
					),
					Match.exhaustive,
				);

			const makeDecodeFailure = (
				field: FieldIdentifier,
				error: FieldDecodeError,
			) =>
				Loadable.Failure({
					error: FieldUnavailable.make({
						namespace: field.namespace,
						name: field.name,
						detail: `published value did not decode: ${error.cause.message}`,
					}),
				});

			const makeCell = <V extends ReadyLoadableValue<unknown>>(
				field: FieldIdentifier,
			) => {
				const cell = signal<Loadable<V, FieldFailure>>(Cold, {
					watched: () => {
						cell.value = Pending;
						Queue.offerUnsafe(outbound, SubscribeMessage.make({ field }));
					},
					unwatched: () => {
						// Cold drops the base with the value, so nothing stale can be read back
						cell.value = Cold;
						Queue.offerUnsafe(outbound, UnsubscribeMessage.make({ field }));
					},
				});
				return cell;
			};

			const makeReject =
				<V extends ReadyLoadableValue<unknown>>(
					cell: Signal<Loadable<V, FieldFailure>>,
					field: FieldIdentifier,
				): CellHandlers<unknown>["reject"] =>
				(reason, message) =>
					isCold(cell.peek())
						? Result.void
						: setSignal(
								cell,
								Loadable.Failure({
									error: makeRejectionError(
										field.namespace,
										field.name,
										reason,
										message,
									),
								}),
							);

			const makeReplicantCell = Effect.fn("makeReplicantCell")(function* <
				Decoded,
			>(namespace: string, name: string, manifest: FieldManifest<Decoded>) {
				const field: ReplicantFieldIdentifier = {
					type: "replicant",
					namespace,
					name,
				};
				const cell = makeCell<ReplicantValue<Decoded>>(field);

				const resyncing = yield* Ref.make(false);
				const requestResync = Effect.gen(function* () {
					const wasResyncing = yield* Ref.getAndSet(resyncing, true);
					if (wasResyncing) {
						return;
					}
					yield* Queue.offer(outbound, ResyncMessage.make({ field }));
				});

				const decodeIntoCell = (encoded: Schema.Json, revision: number) => {
					const loadable = manifest.decode(encoded).pipe(
						Result.match({
							onSuccess: (decoded) =>
								Loadable.Ready({
									value: ReadyLoadableValue.Replicant({
										decoded,
										encoded,
										revision,
									}),
								}),
							onFailure: (error) => makeDecodeFailure(field, error),
						}),
					);
					return setSignal(cell, loadable);
				};

				const applyDeltaToCell = (delta: ReplicantDeltaMessage) =>
					Loadable.$match(cell.peek(), {
						Cold: () => Effect.void,
						Pending: () => Effect.void,
						Failure: () => requestResync,
						Ready: ({ value: current }) =>
							Effect.gen(function* () {
								if (
									delta.baseRevision !== current.revision ||
									delta.revision <= current.revision
								) {
									return yield* requestResync;
								}
								const applied = applyPatch(current.encoded, delta.ops);
								if (Result.isFailure(applied)) {
									yield* Effect.logWarning(
										`Delta for "${namespace}/${name}" did not apply, resyncing:`,
										applied.failure,
									);
									return yield* requestResync;
								}
								if (computeFingerprint(applied.success) !== delta.hash) {
									yield* Effect.logWarning(
										`Delta for "${namespace}/${name}" diverged from the server fingerprint, resyncing`,
									);
									return yield* requestResync;
								}
								yield* Effect.fromResult(
									decodeIntoCell(applied.success, delta.revision),
								);
							}),
					});

				MutableHashMap.set(replicantHandlers, field, {
					applyFrame: (frame) =>
						Effect.gen(function* () {
							if (isCold(cell.peek())) {
								return;
							}
							yield* Match.value(frame).pipe(
								Match.tag("snapshot", (snapshot) =>
									Effect.gen(function* () {
										yield* Ref.set(resyncing, false);
										yield* Effect.fromResult(
											decodeIntoCell(snapshot.value, snapshot.revision),
										);
									}),
								),
								Match.tag("delta", applyDeltaToCell),
								Match.exhaustive,
							);
						}),
					reject: makeReject(cell, field),
				});

				return { signal: cell, peek: () => cell.peek() };
			});

			const makeComputedCell = <Decoded>(
				namespace: string,
				name: string,
				manifest: FieldManifest<Decoded>,
			): ComputedCell<Decoded> => {
				const field: ComputedFieldIdentifier = {
					type: "computed",
					namespace,
					name,
				};
				const cell = makeCell<ComputedValue<Decoded>>(field);

				MutableHashMap.set(computedHandlers, field, {
					applyFrame: (published) =>
						Effect.gen(function* () {
							if (isCold(cell.peek())) {
								return;
							}
							const loadable = manifest.decode(published.value).pipe(
								Result.match({
									onSuccess: (decoded) =>
										Loadable.Ready({
											value: ReadyLoadableValue.Computed({ decoded }),
										}),
									onFailure: (error) => makeDecodeFailure(field, error),
								}),
							);
							yield* Effect.fromResult(setSignal(cell, loadable));
						}),
					reject: makeReject(cell, field),
				});

				return { signal: cell, peek: () => cell.peek() };
			};

			const makeTopicCell = <Decoded>(
				namespace: string,
				name: string,
				manifest: FieldManifest<Decoded>,
			): TopicCell<Decoded> => {
				const field: TopicFieldIdentifier = { type: "topic", namespace, name };
				const cell = makeCell<TopicValue<Decoded>>(field);

				MutableHashMap.set(topicHandlers, field, {
					applyFrame: (published) =>
						Effect.gen(function* () {
							if (isCold(cell.peek())) {
								return;
							}
							const loadable = manifest.decode(published.value).pipe(
								Result.match({
									onSuccess: (decoded) =>
										Loadable.Ready({
											value: ReadyLoadableValue.Topic({ decoded }),
										}),
									onFailure: (error) => makeDecodeFailure(field, error),
								}),
							);
							yield* Effect.fromResult(setSignal(cell, loadable));
						}),
					reject: makeReject(cell, field),
				});

				return { signal: cell, peek: () => cell.peek() };
			};

			const connected = yield* Ref.make(false);
			const subscribed = yield* Ref.make(HashSet.empty<FieldIdentifier>());

			const sendMessage = (message: ClientMessage) =>
				channel
					.send(message)
					.pipe(
						Effect.catchTag("MessageEncodeError", (error) =>
							Effect.logError(
								`Failed to send "${message._tag}" message:`,
								error,
							),
						),
					);

			const handleMessage = Effect.fn(function* (message: ClientMessage) {
				yield* Ref.update(subscribed, (fields) =>
					Match.value(message).pipe(
						Match.tag("subscribe", ({ field }) => HashSet.add(fields, field)),
						Match.tag("unsubscribe", ({ field }) =>
							HashSet.remove(fields, field),
						),
						Match.tag("resync", "ping", () => fields),
						Match.exhaustive,
					),
				);
				const isConnected = yield* Ref.get(connected);
				if (isConnected) {
					yield* sendMessage(message);
				}
			});

			const handleStatus = Effect.fn(function* (status: ConnectionStatus) {
				const isConnected = Match.value(status).pipe(
					Match.when("connected", () => true),
					Match.when("disconnected", () => false),
					Match.exhaustive,
				);
				yield* Ref.set(connected, isConnected);
				if (isConnected) {
					const fields = yield* Ref.get(subscribed);
					yield* Effect.forEach(
						fields,
						(field) => sendMessage(SubscribeMessage.make({ field })),
						{ discard: true },
					);
				}
			});

			const dropLoadSpan = Effect.updateContext<never, never>(
				Context.omit(Tracer.ParentSpan),
			);

			yield* Effect.forkScoped(
				Stream.merge(Stream.fromQueue(outbound), channel.status).pipe(
					Stream.runForEach((next) =>
						Match.value(next).pipe(
							Match.when(isConnectionStatus, handleStatus),
							Match.when(isClientMessage, handleMessage),
							Match.exhaustive,
						),
					),
					dropLoadSpan,
				),
			);

			const incoming = yield* channel.receive();

			const applyFrameToCell = <Key, Message extends PublishMessage>(
				registered: MutableHashMap.MutableHashMap<Key, CellHandlers<Message>>,
				key: Key,
				frame: Message,
			) =>
				Effect.gen(function* () {
					const handler = MutableHashMap.get(registered, key);
					if (Option.isSome(handler)) {
						yield* handler.value
							.applyFrame(frame)
							.pipe(
								Effect.catchTag("SetSignalError", (error) =>
									Effect.logError(
										`A watcher of "${frame.field.namespace}/${frame.field.name}" threw:`,
										error,
									),
								),
							);
					}
				});

			// Pump: server messages handler
			yield* Effect.forkScoped(
				Stream.runForEach(incoming, (message) =>
					Match.value(message).pipe(
						Match.tag("snapshot", "delta", (published) =>
							applyFrameToCell(replicantHandlers, published.field, published),
						),
						Match.tag("value", (published) =>
							Match.value(published.field).pipe(
								Match.when({ type: "computed" }, (field) =>
									applyFrameToCell(computedHandlers, field, published),
								),
								Match.when({ type: "topic" }, (field) =>
									applyFrameToCell(topicHandlers, field, published),
								),
								Match.exhaustive,
							),
						),
						Match.tag("subscribe-rejected", (rejected) =>
							Effect.gen(function* () {
								const handler = Match.value(rejected.field).pipe(
									Match.when({ type: "replicant" }, (field) =>
										MutableHashMap.get(replicantHandlers, field),
									),
									Match.when({ type: "computed" }, (field) =>
										MutableHashMap.get(computedHandlers, field),
									),
									Match.when({ type: "topic" }, (field) =>
										MutableHashMap.get(topicHandlers, field),
									),
									Match.exhaustive,
								);
								if (Option.isSome(handler)) {
									const rejection = handler.value.reject(
										rejected.reason,
										rejected.message,
									);
									if (Result.isFailure(rejection)) {
										yield* Effect.logError(
											`A watcher of "${rejected.field.namespace}/${rejected.field.name}" threw:`,
											rejection.failure,
										);
									}
								}
							}),
						),
						Match.tag("pong", () => Effect.void),
						Match.exhaustive,
					),
				).pipe(dropLoadSpan),
			);

			return {
				replicant: makeReplicantCell,
				computed: makeComputedCell,
				topic: makeTopicCell,
			};
		}),
	},
) {
	static readonly layer = Layer.effect(this, this.make);
}
