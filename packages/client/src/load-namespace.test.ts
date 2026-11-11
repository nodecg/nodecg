import { it } from "@effect/vitest";
import { testLayer } from "@nodecg-private/test-utils";
import { defineNamespace } from "@nodecg/core";
import {
	FieldValueMessage,
	ReplicantSnapshotMessage,
	type ServerMessage,
	SubscribeRejectedMessage,
} from "@nodecg/internal";
import { computeTestHash, RevisionConflict } from "@nodecg/internal/occ";
import {
	Effect,
	Exit,
	Fiber,
	Layer,
	Option,
	PubSub,
	Queue,
	Result,
	Schema,
	Scope,
	Stream,
} from "effect";
import { FetchHttpClient } from "effect/http";
import {
	afterEach,
	assert,
	describe,
	expect,
	expectTypeOf,
	onTestFinished,
	vi,
} from "vitest";

import { derive, fieldSource } from "./derive.ts";
import type { FieldFailure } from "./field-cells.ts";
import {
	DuplicateNamespace,
	loadNamespace,
	loadNamespaceEffect,
} from "./load-namespace.ts";
import { Cold, Pending } from "./loadable.ts";
import { createTransportStub } from "./services/field-transport/field-transport.stub.ts";
import {
	FieldNotFound,
	FieldPermissionDenied,
	FieldTransportService,
	FieldUnavailable,
} from "./services/field-transport/field-transport.ts";
import { createMessageChannelStub } from "./services/message-channel/message-channel.stub.ts";
import { MessageChannelService } from "./services/message-channel/message-channel.ts";

const { stub: transport, reset: resetTransport } = createTransportStub();
const { stub: channel, reset: resetChannel } = createMessageChannelStub();
afterEach(() => {
	resetTransport();
	resetChannel();
});

const test = testLayer(
	Layer.mergeAll(
		Layer.succeed(FieldTransportService, transport),
		Layer.succeed(MessageChannelService, channel),
		FetchHttpClient.layer,
	),
);

const encodedDate = "2030-01-01T00:00:00.000Z";

describe("get", () => {
	test(
		"decodes the value returned by the transport",
		Effect.gen(function* () {
			transport.getReplicant.mockReturnValue(Effect.succeed("42"));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.FiniteFromString } },
			});

			const namespace = yield* loadNamespaceEffect(manifest);

			const count = yield* namespace.replicant.count.get();
			expect(count).toBe(42);
			expectTypeOf(count).toEqualTypeOf<number>();
		}),
	);

	test(
		"fails when the stored value does not match the schema",
		Effect.gen(function* () {
			transport.getReplicant.mockReturnValue(Effect.succeed("not a number"));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const error = yield* loaded.replicant.count.get().pipe(Effect.flip);
			expect(error._tag).toBe("FieldDecodeError");
		}),
	);

	test(
		"propagates FieldNotFound from the transport",
		Effect.gen(function* () {
			transport.getReplicant.mockReturnValue(
				Effect.fail(new FieldNotFound({ namespace: "root", name: "count" })),
			);
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const error = yield* loaded.replicant.count.get().pipe(Effect.flip);
			expect(error._tag).toBe("FieldNotFound");
		}),
	);

	test(
		"reads a stored string back into a Date",
		Effect.gen(function* () {
			transport.getReplicant.mockReturnValue(Effect.succeed(encodedDate));
			const manifest = defineNamespace("root", {
				replicant: { when: { schema: Schema.DateFromString } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const value = yield* loaded.replicant.when.get();
			expect(value.toISOString()).toBe(encodedDate);
		}),
	);
});

describe("set", () => {
	test(
		"encodes the value and writes it via the transport",
		Effect.gen(function* () {
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.FiniteFromString } },
			});

			const namespace = yield* loadNamespaceEffect(manifest);

			yield* namespace.replicant.count.set(7);
			expect(transport.updateReplicant).toHaveBeenCalledExactlyOnceWith(
				"root",
				"count",
				[{ op: "replace", path: "", value: "7" }],
			);
			expectTypeOf(namespace.replicant.count.set)
				.parameter(0)
				.toEqualTypeOf<number>();
		}),
	);

	test(
		"fails when the value fails schema validation",
		Effect.gen(function* () {
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const error = yield* loaded.replicant.count
				.set("not a number" as unknown as number)
				.pipe(Effect.flip);
			expect(error._tag).toBe("FieldEncodeError");
		}),
	);

	test(
		"sends a Date to the transport as a string",
		Effect.gen(function* () {
			const manifest = defineNamespace("root", {
				replicant: { when: { schema: Schema.DateFromString } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			yield* loaded.replicant.when.set(
				yield* Schema.decodeEffect(Schema.DateFromString)(encodedDate),
			);
			expect(transport.updateReplicant).toHaveBeenLastCalledWith(
				"root",
				"when",
				[{ op: "replace", path: "", value: encodedDate }],
			);
		}),
	);
});

describe("update", () => {
	test(
		"reads the current value, applies the fn, and writes the result",
		Effect.gen(function* () {
			transport.getReplicant.mockReturnValue(Effect.succeed(10));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			yield* loaded.replicant.count.update((v) => v + 5);
			expect(transport.updateReplicant).toHaveBeenLastCalledWith(
				"root",
				"count",
				[
					{ op: "test-hash", path: "", hash: computeTestHash(10) },
					{ op: "replace", path: "", value: 15 },
				],
			);
		}),
	);

	test(
		"mutating a draft field ships one replace op for that field alone",
		Effect.gen(function* () {
			transport.getReplicant.mockReturnValue(
				Effect.succeed({ n: "1", kept: "x" }),
			);
			const manifest = defineNamespace("root", {
				replicant: {
					box: {
						schema: Schema.Struct({
							n: Schema.FiniteFromString,
							kept: Schema.String,
						}),
					},
				},
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			yield* loaded.replicant.box.update((draft) => {
				draft.n = 5;
			});
			expect(transport.updateReplicant).toHaveBeenLastCalledWith(
				"root",
				"box",
				[
					{ op: "test-hash", path: "/n", hash: computeTestHash("1") },
					{ op: "replace", path: "/n", value: "5" },
				],
			);
		}),
	);

	test(
		"an updater that changes nothing writes nothing",
		Effect.gen(function* () {
			transport.getReplicant.mockReturnValue(Effect.succeed({ n: "1" }));
			const manifest = defineNamespace("root", {
				replicant: {
					box: { schema: Schema.Struct({ n: Schema.FiniteFromString }) },
				},
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			yield* loaded.replicant.box.update((draft) => {
				draft.n = 1;
			});
			expect(transport.updateReplicant).not.toHaveBeenCalled();
		}),
	);

	test(
		"surfaces a throwing updater as FieldSetError without writing, preserving the message",
		Effect.gen(function* () {
			transport.getReplicant.mockReturnValue(Effect.succeed(10));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const error = yield* loaded.replicant.count
				.update(() => {
					throw new Error("boom");
				})
				.pipe(Effect.flip);
			expect(error._tag).toBe("FieldSetError");
			expect(error.message).toContain("boom");
			expect(transport.updateReplicant).not.toHaveBeenCalled();
		}),
	);

	test(
		"{ retry: false } fails fast as ReplicantWriteConflict carrying the decoded current value",
		Effect.gen(function* () {
			transport.getReplicant.mockReturnValue(Effect.succeed({ n: "1" }));
			transport.updateReplicant.mockReturnValue(
				new RevisionConflict({
					value: { n: "7" },
					revision: 4,
					reason: "HashMismatch",
				}),
			);
			const manifest = defineNamespace("root", {
				replicant: {
					box: { schema: Schema.Struct({ n: Schema.FiniteFromString }) },
				},
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const error = yield* loaded.replicant.box
				.update(
					(draft) => {
						draft.n = 5;
					},
					{ retry: false },
				)
				.pipe(Effect.flip);
			assert(error._tag === "ReplicantWriteConflict");
			expect(error.current).toEqual({ n: 7 });
			expect(error.revision).toBe(4);
			expect(transport.updateReplicant).toHaveBeenCalledTimes(1);
		}),
	);

	test(
		"{ retry: n } resends n times before rejecting",
		Effect.gen(function* () {
			transport.getReplicant.mockReturnValue(Effect.succeed(10));
			transport.updateReplicant.mockReturnValue(
				new RevisionConflict({
					value: 20,
					revision: 5,
					reason: "HashMismatch",
				}),
			);
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const error = yield* loaded.replicant.count
				.update((v) => v + 1, { retry: 2 })
				.pipe(Effect.flip);

			assert(error._tag === "ReplicantWriteConflict");
			expect(transport.updateReplicant).toHaveBeenCalledTimes(3);
		}),
	);
});

describe("subscribe", () => {
	const subscribeFrame = {
		_tag: "subscribe",
		field: { type: "replicant", namespace: "root", name: "count" },
	};
	const unsubscribeFrame = {
		_tag: "unsubscribe",
		field: { type: "replicant", namespace: "root", name: "count" },
	};
	const publishFrame = (value: number, revision = 1): ServerMessage =>
		ReplicantSnapshotMessage.make({
			field: { type: "replicant", namespace: "root", name: "count" },
			value,
			revision,
		});

	test(
		"sends server subscribe and emits decoded matching publishes",
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(Effect.succeed(Stream.fromQueue(queue)));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const head = yield* loaded.replicant.count
				.subscribe()
				.pipe(Effect.flatMap(Stream.runHead), Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame);
				}),
			);

			yield* Queue.offer(queue, publishFrame(42));

			const first = yield* Fiber.join(head);
			expect(first).toEqual(Option.some(Result.succeed(42)));
		}),
	);

	test(
		"ignores publishes for a different name",
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(Effect.succeed(Stream.fromQueue(queue)));
			const manifest = defineNamespace("root", {
				replicant: {
					count: { schema: Schema.Finite },
					other: { schema: Schema.Finite },
				},
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const head = yield* loaded.replicant.count
				.subscribe()
				.pipe(Effect.flatMap(Stream.runHead), Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame);
				}),
			);

			yield* Queue.offer(
				queue,
				ReplicantSnapshotMessage.make({
					field: { type: "replicant", namespace: "root", name: "other" },
					value: 99,
					revision: 1,
				}),
			);
			yield* Queue.offer(queue, publishFrame(7));

			const first = yield* Fiber.join(head);
			expect(first).toEqual(Option.some(Result.succeed(7)));
		}),
	);

	test(
		"sends server unsubscribe when the subscription scope closes",
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(Effect.succeed(Stream.fromQueue(queue)));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const scope = yield* Scope.make();
			const fiber = yield* loaded.replicant.count
				.subscribe()
				.pipe(Effect.asVoid, Scope.provide(scope), Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame);
				}),
			);
			yield* Queue.offer(queue, publishFrame(0));
			yield* Fiber.join(fiber);

			yield* Scope.close(scope, Exit.void);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(unsubscribeFrame);
				}),
			);
		}),
	);

	test(
		"refcounts: subscribe sent once, unsubscribe only after the last scope closes",
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(Effect.succeed(Stream.fromQueue(queue)));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const scope1 = yield* Scope.make();
			const sub1 = yield* loaded.replicant.count
				.subscribe()
				.pipe(Effect.asVoid, Scope.provide(scope1), Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame);
				}),
			);
			yield* Queue.offer(queue, publishFrame(0));
			yield* Fiber.join(sub1);

			const scope2 = yield* Scope.make();
			const sub2 = yield* loaded.replicant.count
				.subscribe()
				.pipe(Effect.asVoid, Scope.provide(scope2), Effect.forkChild);
			yield* Fiber.join(sub2);

			const subscribeCount = channel.send.mock.calls.filter(
				([msg]) => msg._tag === "subscribe",
			).length;
			expect(subscribeCount).toBe(1);

			yield* Scope.close(scope1, Exit.void);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					const hasUnsubscribe = channel.send.mock.calls.some(
						([msg]) => msg._tag === "unsubscribe",
					);
					expect(hasUnsubscribe).toBe(false);
				}),
			);

			yield* Scope.close(scope2, Exit.void);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(unsubscribeFrame);
				}),
			);
		}),
	);

	test(
		"a later subscriber receives the current value on subscribe",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const received1: Array<Result.Result<number, FieldFailure>> = [];
			const scope1 = yield* Scope.make();
			const sub1 = yield* loaded.replicant.count.subscribe().pipe(
				Effect.flatMap((stream) =>
					Stream.runForEach(stream, (value) =>
						Effect.sync(() => received1.push(value)),
					),
				),
				Scope.provide(scope1),
				Effect.forkChild,
			);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame);
				}),
			);
			yield* PubSub.publish(pubsub, publishFrame(5));
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(received1).toEqual([Result.succeed(5)]);
				}),
			);

			const received2: Array<Result.Result<number, FieldFailure>> = [];
			const scope2 = yield* Scope.make();
			const sub2 = yield* loaded.replicant.count.subscribe().pipe(
				Effect.flatMap((stream) =>
					Stream.runForEach(stream, (value) =>
						Effect.sync(() => received2.push(value)),
					),
				),
				Scope.provide(scope2),
				Effect.forkChild,
			);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(received2).toEqual([Result.succeed(5)]);
				}),
			);

			yield* Fiber.interrupt(sub1);
			yield* Fiber.interrupt(sub2);
			yield* Scope.close(scope1, Exit.void);
			yield* Scope.close(scope2, Exit.void);
		}),
	);

	const rejectedFrame = (reason: "forbidden" | "not-found"): ServerMessage =>
		SubscribeRejectedMessage.make({
			field: { type: "replicant", namespace: "root", name: "count" },
			reason,
		});

	test(
		"emits FieldPermissionDenied on a forbidden frame",
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(Effect.succeed(Stream.fromQueue(queue)));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const head = yield* loaded.replicant.count
				.subscribe()
				.pipe(Effect.flatMap(Stream.runHead), Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame);
				}),
			);
			yield* Queue.offer(queue, rejectedFrame("forbidden"));

			const first = yield* Fiber.join(head);
			expect(first).toEqual(
				Option.some(
					Result.fail(
						new FieldPermissionDenied({ namespace: "root", name: "count" }),
					),
				),
			);
		}),
	);

	test(
		"emits FieldNotFound on a not-found frame",
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(Effect.succeed(Stream.fromQueue(queue)));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const head = yield* loaded.replicant.count
				.subscribe()
				.pipe(Effect.flatMap(Stream.runHead), Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame);
				}),
			);
			yield* Queue.offer(queue, rejectedFrame("not-found"));

			const first = yield* Fiber.join(head);
			expect(first).toEqual(
				Option.some(
					Result.fail(new FieldNotFound({ namespace: "root", name: "count" })),
				),
			);
		}),
	);

	test(
		"keeps the stream open after a rejection",
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(Effect.succeed(Stream.fromQueue(queue)));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const received: Array<Result.Result<number, FieldFailure>> = [];
			yield* loaded.replicant.count.subscribe().pipe(
				Effect.flatMap(
					Stream.runForEach((element) =>
						Effect.sync(() => {
							received.push(element);
						}),
					),
				),
				Effect.forkScoped,
			);
			yield* Effect.promise(() =>
				vi.waitFor(() =>
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame),
				),
			);
			yield* Queue.offer(queue, publishFrame(1));
			yield* Queue.offer(queue, rejectedFrame("forbidden"));
			yield* Queue.offer(queue, publishFrame(7, 2));

			yield* Effect.promise(() =>
				vi.waitFor(() =>
					expect(received).toEqual([
						Result.succeed(1),
						Result.fail(
							new FieldPermissionDenied({ namespace: "root", name: "count" }),
						),
						Result.succeed(7),
					]),
				),
			);
		}),
	);

	test(
		"emits a publish that does not decode as FieldUnavailable",
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(Effect.succeed(Stream.fromQueue(queue)));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const received: Array<Result.Result<number, FieldFailure>> = [];
			yield* loaded.replicant.count.subscribe().pipe(
				Effect.flatMap(
					Stream.runForEach((value) =>
						Effect.sync(() => {
							received.push(value);
						}),
					),
				),
				Effect.forkScoped,
			);
			yield* Effect.promise(() =>
				vi.waitFor(() =>
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame),
				),
			);
			yield* Queue.offer(queue, publishFrame(1));
			yield* Queue.offer(
				queue,
				ReplicantSnapshotMessage.make({
					field: { type: "replicant", namespace: "root", name: "count" },
					value: "not a number",
					revision: 2,
				}),
			);
			yield* Queue.offer(queue, publishFrame(7, 3));

			yield* Effect.promise(() =>
				vi.waitFor(() =>
					expect(received).toEqual([
						Result.succeed(1),
						Result.fail(
							expect.objectContaining({
								_tag: "FieldUnavailable",
								namespace: "root",
								name: "count",
								detail: expect.stringContaining(
									"published value did not decode",
								),
							}),
						),
						Result.succeed(7),
					]),
				),
			);
		}),
	);

	test(
		"a fresh subscribe after a rejection delivers the next publish",
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(Effect.succeed(Stream.fromQueue(queue)));
			const manifest = defineNamespace("root", {
				replicant: { count: { schema: Schema.Finite } },
			});

			const loaded = yield* loadNamespaceEffect(manifest);

			const scope1 = yield* Scope.make();
			const fiber1 = yield* loaded.replicant.count
				.subscribe()
				.pipe(
					Effect.flatMap(Stream.runHead),
					Scope.provide(scope1),
					Effect.forkChild,
				);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame);
				}),
			);
			yield* Queue.offer(queue, rejectedFrame("forbidden"));
			yield* Fiber.join(fiber1);
			yield* Scope.close(scope1, Exit.void);

			const scope2 = yield* Scope.make();
			const head = yield* loaded.replicant.count
				.subscribe()
				.pipe(
					Effect.flatMap(Stream.runHead),
					Scope.provide(scope2),
					Effect.forkChild,
				);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					const subscribeCount = channel.send.mock.calls.filter(
						([msg]) => msg._tag === "subscribe",
					).length;
					expect(subscribeCount).toBe(2);
				}),
			);
			yield* Queue.offer(queue, publishFrame(5));
			const first = yield* Fiber.join(head);
			expect(first).toEqual(Option.some(Result.succeed(5)));
			yield* Scope.close(scope2, Exit.void);
		}),
	);
});

describe("computed", () => {
	const computedManifest = defineNamespace("root", {
		replicant: {
			games: { schema: Schema.Array(Schema.Struct({ id: Schema.String })) },
		},
		computed: { firstGameId: { schema: Schema.NullOr(Schema.String) } },
	});

	test(
		"get decodes the computed value from the transport",
		Effect.gen(function* () {
			transport.getComputed.mockReturnValue(Effect.succeed("a"));

			const loaded = yield* loadNamespaceEffect(computedManifest);

			expect(yield* loaded.computed.firstGameId.get()).toBe("a");
		}),
	);

	test(
		"is read-only (no set)",
		Effect.gen(function* () {
			const loaded = yield* loadNamespaceEffect(computedManifest);

			expect("set" in loaded.computed.firstGameId).toBe(false);
		}),
	);

	test(
		"subscribe emits decoded matching publishes",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);

			const loaded = yield* loadNamespaceEffect(computedManifest);

			const head = yield* loaded.computed.firstGameId
				.subscribe()
				.pipe(Effect.flatMap(Stream.runHead), Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith({
						_tag: "subscribe",
						field: {
							type: "computed",
							namespace: "root",
							name: "firstGameId",
						},
					});
				}),
			);

			yield* PubSub.publish(
				pubsub,
				FieldValueMessage.make({
					field: { type: "computed", namespace: "root", name: "firstGameId" },
					value: "z",
				}),
			);

			const first = yield* Fiber.join(head);
			expect(first).toEqual(Option.some(Result.succeed("z")));
		}),
	);
});

describe("topic", () => {
	const topicManifest = defineNamespace("root", {
		topic: { chat: { schema: Schema.Finite } },
	});
	const subscribeFrame = {
		_tag: "subscribe",
		field: { type: "topic", namespace: "root", name: "chat" },
	};
	const unsubscribeFrame = {
		_tag: "unsubscribe",
		field: { type: "topic", namespace: "root", name: "chat" },
	};
	const publishFrame = (value: number): ServerMessage =>
		FieldValueMessage.make({
			field: { type: "topic", namespace: "root", name: "chat" },
			value,
		});

	test(
		"publish encodes the value and forwards it to the transport",
		Effect.gen(function* () {
			const loaded = yield* loadNamespaceEffect(topicManifest);

			yield* loaded.topic.chat.publish(7);
			expect(transport.publishTopic).toHaveBeenCalledWith("root", "chat", 7);
		}),
	);

	test(
		"publish fails when the value fails schema validation",
		Effect.gen(function* () {
			const loaded = yield* loadNamespaceEffect(topicManifest);

			const error = yield* loaded.topic.chat
				.publish("nope" as unknown as number)
				.pipe(Effect.flip);
			expect(error._tag).toBe("FieldEncodeError");
		}),
	);

	test(
		"subscribe sends server subscribe and emits decoded matching publishes",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const loaded = yield* loadNamespaceEffect(topicManifest);

			const head = yield* loaded.topic.chat
				.subscribe()
				.pipe(Effect.flatMap(Stream.runHead), Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame);
				}),
			);

			yield* PubSub.publish(
				pubsub,
				FieldValueMessage.make({
					field: { type: "topic", namespace: "root", name: "other" },
					value: 99,
				}),
			);
			yield* PubSub.publish(pubsub, publishFrame(42));

			const first = yield* Fiber.join(head);
			expect(first).toEqual(Option.some(Result.succeed(42)));
		}),
	);

	test(
		"refcounts: subscribe sent once, unsubscribe only after the last scope closes",
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(Effect.succeed(Stream.fromQueue(queue)));
			const loaded = yield* loadNamespaceEffect(topicManifest);

			const scope1 = yield* Scope.make();
			const sub1 = yield* loaded.topic.chat
				.subscribe()
				.pipe(Effect.asVoid, Scope.provide(scope1), Effect.forkChild);
			yield* Fiber.join(sub1);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame);
				}),
			);

			const scope2 = yield* Scope.make();
			const sub2 = yield* loaded.topic.chat
				.subscribe()
				.pipe(Effect.asVoid, Scope.provide(scope2), Effect.forkChild);
			yield* Fiber.join(sub2);

			const subscribeCount = channel.send.mock.calls.filter(
				([msg]) => msg._tag === "subscribe",
			).length;
			expect(subscribeCount).toBe(1);

			yield* Scope.close(scope1, Exit.void);
			const hasUnsubscribe = channel.send.mock.calls.some(
				([msg]) => msg._tag === "unsubscribe",
			);
			expect(hasUnsubscribe).toBe(false);

			yield* Scope.close(scope2, Exit.void);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(unsubscribeFrame);
				}),
			);
		}),
	);

	test(
		"a late subscriber does not replay the topic's last event",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const loaded = yield* loadNamespaceEffect(topicManifest);

			const seen1: Array<Result.Result<number, FieldFailure>> = [];
			const stream1 = yield* loaded.topic.chat.subscribe();
			yield* Stream.runForEach(stream1, (v) =>
				Effect.sync(() => seen1.push(v)),
			).pipe(Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame);
				}),
			);

			yield* PubSub.publish(pubsub, publishFrame(1));
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(seen1).toEqual([Result.succeed(1)]);
				}),
			);

			const seen2: Array<Result.Result<number, FieldFailure>> = [];
			const stream2 = yield* loaded.topic.chat.subscribe();
			yield* Stream.runForEach(stream2, (v) =>
				Effect.sync(() => seen2.push(v)),
			).pipe(Effect.forkChild);

			yield* PubSub.publish(pubsub, publishFrame(2));
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(seen1).toEqual([Result.succeed(1), Result.succeed(2)]);
					expect(seen2).toEqual([Result.succeed(2)]);
				}),
			);
		}),
	);

	test(
		"keeps the stream open after a rejection",
		Effect.gen(function* () {
			const queue = yield* Queue.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(Effect.succeed(Stream.fromQueue(queue)));
			const loaded = yield* loadNamespaceEffect(topicManifest);

			const seen: Array<Result.Result<number, FieldFailure>> = [];
			yield* loaded.topic.chat.subscribe().pipe(
				Effect.flatMap(
					Stream.runForEach((element) =>
						Effect.sync(() => {
							seen.push(element);
						}),
					),
				),
				Effect.forkScoped,
			);
			yield* Effect.promise(() =>
				vi.waitFor(() =>
					expect(channel.send).toHaveBeenCalledWith(subscribeFrame),
				),
			);
			yield* Queue.offer(queue, publishFrame(1));
			yield* Queue.offer(
				queue,
				SubscribeRejectedMessage.make({
					field: { type: "topic", namespace: "root", name: "chat" },
					reason: "forbidden",
				}),
			);
			yield* Queue.offer(queue, publishFrame(2));

			yield* Effect.promise(() =>
				vi.waitFor(() =>
					expect(seen).toEqual([
						Result.succeed(1),
						Result.fail(
							new FieldPermissionDenied({ namespace: "root", name: "chat" }),
						),
						Result.succeed(2),
					]),
				),
			);
		}),
	);
});

describe("rpc", () => {
	const rpcManifest = defineNamespace("root", {
		rpc: {
			echo: { schema: { request: Schema.Finite, response: Schema.Finite } },
			when: {
				schema: {
					request: Schema.Finite,
					response: Schema.DateFromString,
				},
			},
		},
	});

	test(
		"call encodes the request, forwards it, and decodes the response",
		Effect.gen(function* () {
			transport.callRpc.mockReturnValue(Effect.succeed(84));
			const loaded = yield* loadNamespaceEffect(rpcManifest);

			const result = yield* loaded.rpc.echo.call(42);
			expect(result).toBe(84);
			expect(transport.callRpc).toHaveBeenCalledWith("root", "echo", 42);
		}),
	);

	test(
		"call decodes a string response into a Date",
		Effect.gen(function* () {
			transport.callRpc.mockReturnValue(Effect.succeed(encodedDate));
			const loaded = yield* loadNamespaceEffect(rpcManifest);

			const result = yield* loaded.rpc.when.call(1);
			expect(result.toISOString()).toBe(encodedDate);
		}),
	);

	test(
		"call propagates a typed transport error",
		Effect.gen(function* () {
			transport.callRpc.mockReturnValue(
				Effect.fail(
					new FieldPermissionDenied({ namespace: "root", name: "echo" }),
				),
			);
			const loaded = yield* loadNamespaceEffect(rpcManifest);

			const error = yield* loaded.rpc.echo.call(42).pipe(Effect.flip);
			expect(error._tag).toBe("FieldPermissionDenied");
		}),
	);

	test(
		"call fails when the response does not match the schema",
		Effect.gen(function* () {
			transport.callRpc.mockReturnValue(Effect.succeed("not a number"));
			const loaded = yield* loadNamespaceEffect(rpcManifest);

			const error = yield* loaded.rpc.echo.call(42).pipe(Effect.flip);
			expect(error._tag).toBe("FieldDecodeError");
		}),
	);
});

describe("customRoute", () => {
	const routeManifest = defineNamespace("root", {
		customRoute: { upload: { post: {} } },
	});

	test(
		"url points at the route",
		Effect.gen(function* () {
			const loaded = yield* loadNamespaceEffect(routeManifest);

			expect(loaded.customRoute.upload.url).toBe(
				"/namespaces/root/custom/upload",
			);
		}),
	);

	test(
		"url appends to a base URL with a path",
		Effect.gen(function* () {
			const loaded = yield* loadNamespaceEffect(routeManifest, {
				baseUrl: "https://example.com/foo/",
			});

			expect(loaded.customRoute.upload.url).toBe(
				"https://example.com/foo/namespaces/root/custom/upload",
			);
		}),
	);

	test(
		"fails to load with an invalid base URL",
		Effect.gen(function* () {
			const error = yield* loadNamespaceEffect(routeManifest, {
				baseUrl: "not a url",
			}).pipe(Effect.flip);

			expect(error.message).toBe('Invalid URL: "not a url"');
		}),
	);

	test(
		"types refuse a route the manifest does not declare",
		Effect.gen(function* () {
			const loaded = yield* loadNamespaceEffect(routeManifest);

			// @ts-expect-error missing is not a declared route
			expect(loaded.customRoute.missing).toBeUndefined();
		}),
	);
});

describe("children", () => {
	const first = defineNamespace("first", {
		replicant: { count: { schema: Schema.FiniteFromString } },
	});
	const second = defineNamespace("second", {
		replicant: { count: { schema: Schema.FiniteFromString } },
	});

	test(
		"loads each namespace of the tree under its key",
		Effect.gen(function* () {
			transport.getReplicant.mockImplementation((namespace) =>
				Effect.succeed(namespace === "first" ? "4" : "9"),
			);
			const middle = defineNamespace("middle", { children: { second } });
			const root = defineNamespace("root", { children: { first, middle } });

			const loaded = yield* loadNamespaceEffect(root);

			const firstCount = yield* loaded.children.first.replicant.count.get();
			const secondCount =
				yield* loaded.children.middle.children.second.replicant.count.get();
			expect(firstCount).toBe(4);
			expect(secondCount).toBe(9);
			// @ts-expect-error middle declares no child named first
			expect(loaded.children.middle.children.first).toBeUndefined();
		}),
	);

	test(
		"builds a child reached from two parents once",
		Effect.gen(function* () {
			const middle = defineNamespace("middle", { children: { first } });
			const root = defineNamespace("root", { children: { middle, first } });

			const loaded = yield* loadNamespaceEffect(root);

			expect(loaded.children.middle.children.first).toBe(loaded.children.first);
		}),
	);

	test(
		"fails when two children name the same namespace",
		Effect.gen(function* () {
			const lookalike = defineNamespace("first", {});
			const root = defineNamespace("root", {
				children: { first, again: lookalike },
			});

			const error = yield* loadNamespaceEffect(root).pipe(Effect.flip);

			expect(error).toStrictEqual(
				DuplicateNamespace.make({ namespace: "first" }),
			);
			expect(error.message).toBe('Namespace "first" was loaded twice');
			expect(channel.receive).not.toHaveBeenCalled();
		}),
	);
});

describe("loadNamespace (Promise wrapper)", () => {
	it("reaches a child through the handle", async () => {
		const { stub: transportStub } = createTransportStub();
		const { stub: channelStub } = createMessageChannelStub();
		transportStub.getReplicant.mockReturnValue(Effect.succeed(42));
		const child = defineNamespace("child", {
			replicant: { count: { schema: Schema.Finite } },
		});
		const root = defineNamespace("root", { children: { child } });

		const loaded = await loadNamespace(root, {
			fieldTransport: () => transportStub,
			messageChannel: () => channelStub,
		});
		onTestFinished(() => loaded.dispose());

		expect(await loaded.children.child.replicant.count.get()).toBe(42);
		expect(transportStub.getReplicant).toHaveBeenCalledWith("child", "count");
	});

	it("gives a child reached from two parents one handle", async () => {
		const { stub: transportStub } = createTransportStub();
		const { stub: channelStub } = createMessageChannelStub();
		const child = defineNamespace("child", {});
		const middle = defineNamespace("middle", { children: { child } });
		const root = defineNamespace("root", { children: { middle, child } });

		const loaded = await loadNamespace(root, {
			fieldTransport: () => transportStub,
			messageChannel: () => channelStub,
		});
		onTestFinished(() => loaded.dispose());

		expect(loaded.children.middle.children.child).toBe(loaded.children.child);
	});

	it("forwards to the injected transport", async () => {
		const { stub: transportStub } = createTransportStub();
		const { stub: channelStub } = createMessageChannelStub();
		transportStub.getReplicant.mockReturnValue(Effect.succeed(42));
		const manifest = defineNamespace("root", {
			replicant: { count: { schema: Schema.Finite } },
		});

		const loaded = await loadNamespace(manifest, {
			fieldTransport: () => transportStub,
			messageChannel: () => channelStub,
		});

		expect(await loaded.replicant.count.get()).toBe(42);
		await loaded.replicant.count.set(9);
		expect(transportStub.updateReplicant).toHaveBeenCalledWith(
			"root",
			"count",
			[{ op: "replace", path: "", value: 9 }],
		);
	});

	it("publishes a topic and calls an rpc through the Promise API", async () => {
		const { stub: transportStub } = createTransportStub();
		const { stub: channelStub } = createMessageChannelStub();
		transportStub.callRpc.mockReturnValue(Effect.succeed(84));
		const manifest = defineNamespace("root", {
			topic: { chat: { schema: Schema.Finite } },
			rpc: {
				echo: { schema: { request: Schema.Finite, response: Schema.Finite } },
			},
		});

		const loaded = await loadNamespace(manifest, {
			fieldTransport: () => transportStub,
			messageChannel: () => channelStub,
		});

		await loaded.topic.chat.publish(3);
		expect(transportStub.publishTopic).toHaveBeenCalledWith("root", "chat", 3);
		expect(await loaded.rpc.echo.call(42)).toBe(84);
		expect(transportStub.callRpc).toHaveBeenCalledWith("root", "echo", 42);
	});

	it("calls onError when the subscribe is rejected after the first value", async () => {
		const { stub: transportStub } = createTransportStub();
		const { stub: channelStub } = createMessageChannelStub();
		const queue = await Effect.runPromise(Queue.unbounded<ServerMessage>());
		channelStub.receive.mockReturnValue(
			Effect.succeed(Stream.fromQueue(queue)),
		);
		const manifest = defineNamespace("root", {
			replicant: { count: { schema: Schema.Finite } },
		});
		const field = {
			type: "replicant",
			namespace: "root",
			name: "count",
		} as const;

		const loaded = await loadNamespace(manifest, {
			fieldTransport: () => transportStub,
			messageChannel: () => channelStub,
		});

		const received: number[] = [];
		const onError = vi.fn();
		const cancel = loaded.replicant.count.subscribe((value) => {
			received.push(value);
		}, onError);
		onTestFinished(() => cancel());
		Queue.offerUnsafe(
			queue,
			ReplicantSnapshotMessage.make({ field, value: 1, revision: 1 }),
		);
		await vi.waitFor(() => expect(received).toEqual([1]));

		Queue.offerUnsafe(
			queue,
			SubscribeRejectedMessage.make({ field, reason: "forbidden" }),
		);
		await vi.waitFor(() =>
			expect(onError).toHaveBeenCalledWith(
				new FieldPermissionDenied({ namespace: "root", name: "count" }),
			),
		);
		expect(received).toEqual([1]);
	});

	it("keeps delivering after a first-load failure", async () => {
		const { stub: channelStub } = createMessageChannelStub();
		const queue = await Effect.runPromise(Queue.unbounded<ServerMessage>());
		channelStub.receive.mockReturnValue(
			Effect.succeed(Stream.fromQueue(queue)),
		);
		const manifest = defineNamespace("root", {
			replicant: { count: { schema: Schema.Finite } },
		});
		const field = {
			type: "replicant",
			namespace: "root",
			name: "count",
		} as const;
		const loaded = await loadNamespace(manifest, {
			fieldTransport: () => createTransportStub().stub,
			messageChannel: () => channelStub,
		});

		const received: number[] = [];
		const onError = vi.fn();
		const cancel = loaded.replicant.count.subscribe((value) => {
			received.push(value);
		}, onError);
		onTestFinished(() => cancel());
		Queue.offerUnsafe(
			queue,
			SubscribeRejectedMessage.make({
				field,
				reason: "unavailable",
				message: "compute failed",
			}),
		);
		Queue.offerUnsafe(
			queue,
			ReplicantSnapshotMessage.make({ field, value: 1, revision: 1 }),
		);

		await vi.waitFor(() => expect(received).toEqual([1]));
		expect(onError).toHaveBeenCalledWith(
			new FieldUnavailable({
				namespace: "root",
				name: "count",
				detail: "compute failed",
			}),
		);
	});

	it("dispose ends open subscriptions", async () => {
		const manifest = defineNamespace("root", {
			replicant: { count: { schema: Schema.Finite } },
		});
		const loaded = await loadNamespace(manifest, {
			fieldTransport: () => createTransportStub().stub,
			messageChannel: () => createMessageChannelStub().stub,
		});

		loaded.replicant.count.subscribe(() => {});
		expect(loaded.replicant.count[fieldSource].value).toEqual(Pending);
		loaded.dispose();

		await vi.waitFor(() =>
			expect(loaded.replicant.count[fieldSource].value).toEqual(Cold),
		);
	});

	it("a replicant subscriber gets the old value", async () => {
		const { stub: channelStub } = createMessageChannelStub();
		const queue = await Effect.runPromise(Queue.unbounded<ServerMessage>());
		channelStub.receive.mockReturnValue(
			Effect.succeed(Stream.fromQueue(queue)),
		);
		const manifest = defineNamespace("root", {
			replicant: { count: { schema: Schema.FiniteFromString } },
		});
		const field = {
			type: "replicant",
			namespace: "root",
			name: "count",
		} as const;
		const loaded = await loadNamespace(manifest, {
			fieldTransport: () => createTransportStub().stub,
			messageChannel: () => channelStub,
		});

		const received: Array<[number, number | undefined]> = [];
		const cancel = loaded.replicant.count.subscribe((value, oldValue) => {
			received.push([value, oldValue]);
		});
		onTestFinished(() => cancel());
		Queue.offerUnsafe(
			queue,
			ReplicantSnapshotMessage.make({ field, value: "1", revision: 1 }),
		);
		Queue.offerUnsafe(
			queue,
			ReplicantSnapshotMessage.make({ field, value: "2", revision: 2 }),
		);
		Queue.offerUnsafe(
			queue,
			ReplicantSnapshotMessage.make({ field, value: "3", revision: 3 }),
		);

		await vi.waitFor(() =>
			expect(received).toEqual([
				[1, undefined],
				[2, 1],
				[3, 2],
			]),
		);
	});

	it("a computed subscriber gets the old value", async () => {
		const { stub: channelStub } = createMessageChannelStub();
		const queue = await Effect.runPromise(Queue.unbounded<ServerMessage>());
		channelStub.receive.mockReturnValue(
			Effect.succeed(Stream.fromQueue(queue)),
		);
		const manifest = defineNamespace("root", {
			computed: { doubled: { schema: Schema.FiniteFromString } },
		});
		const field = {
			type: "computed",
			namespace: "root",
			name: "doubled",
		} as const;
		const loaded = await loadNamespace(manifest, {
			fieldTransport: () => createTransportStub().stub,
			messageChannel: () => channelStub,
		});

		const received: Array<[number, number | undefined]> = [];
		const cancel = loaded.computed.doubled.subscribe((value, oldValue) => {
			received.push([value, oldValue]);
		});
		onTestFinished(() => cancel());
		Queue.offerUnsafe(queue, FieldValueMessage.make({ field, value: "2" }));
		Queue.offerUnsafe(queue, FieldValueMessage.make({ field, value: "6" }));
		Queue.offerUnsafe(queue, FieldValueMessage.make({ field, value: "10" }));

		await vi.waitFor(() =>
			expect(received).toEqual([
				[2, undefined],
				[6, 2],
				[10, 6],
			]),
		);
	});
});

describe("derivation over loaded fields", () => {
	const manifest = defineNamespace("match", {
		replicant: {
			scoreLeft: { schema: Schema.FiniteFromString },
			scoreRight: { schema: Schema.FiniteFromString },
		},
	});

	const publish = (name: string, value: number, revision = 1): ServerMessage =>
		ReplicantSnapshotMessage.make({
			field: { type: "replicant", namespace: "match", name },
			value: String(value),
			revision,
		});

	test(
		"derive spans loaded fields and updates as publishes arrive",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const loaded = yield* loadNamespaceEffect(manifest);

			const leader = derive((get) => {
				const left = get(loaded.replicant.scoreLeft);
				const right = get(loaded.replicant.scoreRight);
				if (left === right) {
					return "tie";
				}
				return left > right ? "left" : "right";
			});

			const seen: string[] = [];
			const unsubscribe = leader.subscribe((value) => {
				seen.push(value);
			});
			onTestFinished(() => unsubscribe());

			// Synchronous get() suspensions
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(
						channel.send.mock.calls.filter(([msg]) => msg._tag === "subscribe"),
					).toHaveLength(1);
				}),
			);
			yield* PubSub.publish(pubsub, publish("scoreLeft", 0));
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(
						channel.send.mock.calls.filter(([msg]) => msg._tag === "subscribe"),
					).toHaveLength(2);
				}),
			);
			yield* PubSub.publish(pubsub, publish("scoreRight", 0));
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(seen.at(-1)).toBe("tie");
				}),
			);

			yield* PubSub.publish(pubsub, publish("scoreLeft", 3, 2));
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(seen.at(-1)).toBe("left");
				}),
			);

			// get() runs the compute directly off the sources' own get()
			expect(yield* Effect.promise(() => leader.get())).toBe("left");
		}),
	);

	test(
		"get reads the live cell without a transport round-trip while subscribed",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const loaded = yield* loadNamespaceEffect(manifest);

			const scope = yield* Scope.make();
			yield* loaded.replicant.scoreLeft
				.subscribe()
				.pipe(Scope.provide(scope), Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(
						channel.send.mock.calls.some(([msg]) => msg._tag === "subscribe"),
					).toBe(true);
				}),
			);
			yield* PubSub.publish(pubsub, publish("scoreLeft", 7));
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(channel.send.mock.calls.length).toBeGreaterThan(0);
				}),
			);

			const context = yield* Effect.context();
			yield* Effect.promise(() =>
				vi.waitFor(async () => {
					expect(
						await Effect.runPromiseWith(context)(
							loaded.replicant.scoreLeft.get(),
						),
					).toBe(7);
				}),
			);
			expect(transport.getReplicant).not.toHaveBeenCalled();

			yield* Scope.close(scope, Exit.void);
		}),
	);

	test(
		"a write lands in the hot cell only as the server echo, which the next update reads as its base",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const loaded = yield* loadNamespaceEffect(manifest);

			const scope = yield* Scope.make();
			yield* loaded.replicant.scoreLeft
				.subscribe()
				.pipe(Scope.provide(scope), Effect.forkChild);
			yield* Effect.promise(() =>
				vi.waitFor(() => {
					expect(
						channel.send.mock.calls.some(([msg]) => msg._tag === "subscribe"),
					).toBe(true);
				}),
			);
			yield* PubSub.publish(pubsub, publish("scoreLeft", 0));
			const runPromise = yield* Effect.context().pipe(
				Effect.map(Effect.runPromiseWith),
			);
			yield* Effect.promise(() =>
				vi.waitFor(async () => {
					expect(await runPromise(loaded.replicant.scoreLeft.get())).toBe(0);
				}),
			);

			yield* loaded.replicant.scoreLeft.set(10);
			expect(yield* loaded.replicant.scoreLeft.get()).toBe(0);

			yield* PubSub.publish(pubsub, publish("scoreLeft", 10, 2));
			yield* Effect.promise(() =>
				vi.waitFor(async () => {
					expect(await runPromise(loaded.replicant.scoreLeft.get())).toBe(10);
				}),
			);

			transport.getReplicant.mockClear();
			yield* loaded.replicant.scoreLeft.update((v) => v + 1);

			expect(transport.updateReplicant).toHaveBeenLastCalledWith(
				"match",
				"scoreLeft",
				[
					{ op: "test-hash", path: "", hash: computeTestHash("10") },
					{ op: "replace", path: "", value: "11" },
				],
			);
			expect(transport.getReplicant).not.toHaveBeenCalled();

			yield* Scope.close(scope, Exit.void);
		}),
	);
});
