import { testLayer } from "@nodecg-private/test-utils";
import { defineNamespace } from "@nodecg/core";
import {
	ReplicantDeltaMessage,
	ReplicantSnapshotMessage,
	type ServerMessage,
	SubscribeMessage,
	SubscribeRejectedMessage,
} from "@nodecg/internal";
import { computeFingerprint } from "@nodecg/internal/occ";
import { effect, type Signal } from "@preact/signals-core";
import {
	Context,
	Effect,
	Layer,
	Option,
	PubSub,
	Schema,
	Stream,
	SubscriptionRef,
	Tracer,
} from "effect";
import { afterEach, describe, expect, onTestFinished, vi } from "vitest";

import { FieldCellsService } from "./field-cells.ts";
import { Loadable, Pending, ReadyLoadableValue } from "./loadable.ts";
import {
	FieldNotFound,
	FieldPermissionDenied,
	FieldUnavailable,
} from "./services/field-transport/field-transport.ts";
import { createMessageChannelStub } from "./services/message-channel/message-channel.stub.ts";
import {
	type ConnectionStatus,
	MessageChannelService,
} from "./services/message-channel/message-channel.ts";

const { stub: channel, reset } = createMessageChannelStub();
afterEach(reset);

const test = testLayer(Layer.succeed(MessageChannelService, channel));

const namespace = defineNamespace("match", {
	replicant: {
		scoreLeft: { schema: Schema.FiniteFromString },
		scoreRight: { schema: Schema.FiniteFromString },
	},
	computed: {
		total: { schema: Schema.FiniteFromString },
	},
});

const snapshot = (
	name: string,
	value: number | string,
	revision = 1,
): ServerMessage =>
	ReplicantSnapshotMessage.make({
		field: { type: "replicant", namespace: "match", name },
		value: String(value),
		revision,
	});

const delta = (
	name: string,
	value: string,
	baseRevision: number,
	revision: number,
	hash: number,
): ServerMessage =>
	ReplicantDeltaMessage.make({
		field: { type: "replicant", namespace: "match", name },
		ops: [{ op: "replace", path: "", value }],
		baseRevision,
		revision,
		hash,
	});

const resync = {
	_tag: "resync",
	field: { type: "replicant", namespace: "match", name: "scoreLeft" },
};

const waitFor = (assertion: () => void) =>
	Effect.promise(() => vi.waitFor(assertion));

const makeCells = Layer.build(FieldCellsService.layer).pipe(
	Effect.map((context) => Context.get(context, FieldCellsService)),
);

const observe = <V>(target: Signal<V>) => {
	const seen: V[] = [];
	const dispose = effect(() => {
		seen.push(target.value);
	});
	onTestFinished(() => dispose());
	return { seen, dispose };
};

const ready = (decoded: number, encoded: string, revision: number) =>
	Loadable.Ready({
		value: ReadyLoadableValue.Replicant({ decoded, encoded, revision }),
	});

describe("FieldCellsService", () => {
	test(
		"sends outside the span that built the cells",
		Effect.gen(function* () {
			const hasParent: Array<boolean> = [];
			channel.send.mockImplementation(() =>
				Effect.serviceOption(Tracer.ParentSpan).pipe(
					Effect.map((parent) => {
						hasParent.push(Option.isSome(parent));
					}),
				),
			);
			const cells = yield* makeCells.pipe(Effect.withSpan("load"));
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			observe(cell.signal);
			yield* waitFor(() => {
				expect(hasParent).toEqual([false]);
			});
		}),
	);

	test(
		"subscribes on the first watcher and goes Ready when a publish arrives",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const { seen } = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(
						([m]) => m._tag === "subscribe" && m.field.name === "scoreLeft",
					),
				).toBe(true);
			});

			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 5));
			yield* waitFor(() => {
				expect(seen).toEqual([Pending, ready(5, "5", 1)]);
			});
		}),
	);

	test(
		"unsubscribes when the last watcher goes away",
		Effect.gen(function* () {
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const first = observe(cell.signal);
			const second = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.filter(([m]) => m._tag === "subscribe"),
				).toHaveLength(1);
			});
			expect(first.seen).toEqual([Pending]);
			expect(second.seen).toEqual([Pending]);

			first.dispose();
			expect(
				channel.send.mock.calls.some(([m]) => m._tag === "unsubscribe"),
			).toBe(false);
			second.dispose();
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(
						([m]) => m._tag === "unsubscribe" && m.field.name === "scoreLeft",
					),
				).toBe(true);
			});
			expect(cell.peek()._tag).toBe("Cold");
		}),
	);

	test(
		"fails the cell with FieldPermissionDenied when the subscribe is forbidden",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const { seen } = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(([m]) => m._tag === "subscribe"),
				).toBe(true);
			});

			yield* PubSub.publish(
				pubsub,
				SubscribeRejectedMessage.make({
					field: { type: "replicant", namespace: "match", name: "scoreLeft" },
					reason: "forbidden",
				}),
			);

			yield* waitFor(() => {
				expect(seen).toEqual([
					Pending,
					Loadable.Failure({
						error: new FieldPermissionDenied({
							namespace: "match",
							name: "scoreLeft",
						}),
					}),
				]);
			});
		}),
	);

	test(
		"fails the cell with FieldNotFound when the field does not exist",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const { seen } = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(([m]) => m._tag === "subscribe"),
				).toBe(true);
			});

			yield* PubSub.publish(
				pubsub,
				SubscribeRejectedMessage.make({
					field: { type: "replicant", namespace: "match", name: "scoreLeft" },
					reason: "not-found",
				}),
			);

			yield* waitFor(() => {
				expect(seen).toEqual([
					Pending,
					Loadable.Failure({
						error: new FieldNotFound({
							namespace: "match",
							name: "scoreLeft",
						}),
					}),
				]);
			});
		}),
	);

	test(
		"fails the cell with FieldUnavailable when a computed subscribe is unavailable",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = cells.computed("match", "total", namespace.computed.total);

			const { seen } = observe(cell.signal);

			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(([m]) => m._tag === "subscribe"),
				).toBe(true);
			});

			yield* PubSub.publish(
				pubsub,
				SubscribeRejectedMessage.make({
					field: { type: "computed", namespace: "match", name: "total" },
					reason: "unavailable",
					message: "compute boom",
				}),
			);

			yield* waitFor(() => {
				expect(seen).toEqual([
					Pending,
					Loadable.Failure({
						error: new FieldUnavailable({
							namespace: "match",
							name: "total",
							detail: "compute boom",
						}),
					}),
				]);
			});
		}),
	);

	test(
		"re-arms a rejected field to Pending on a fresh subscribe so a later publish heals it",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const first = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(([m]) => m._tag === "subscribe"),
				).toBe(true);
			});
			yield* PubSub.publish(
				pubsub,
				SubscribeRejectedMessage.make({
					field: { type: "replicant", namespace: "match", name: "scoreLeft" },
					reason: "forbidden",
				}),
			);
			yield* waitFor(() => {
				expect(first.seen).toEqual([
					Pending,
					Loadable.Failure({
						error: new FieldPermissionDenied({
							namespace: "match",
							name: "scoreLeft",
						}),
					}),
				]);
			});
			first.dispose();
			expect(cell.peek()._tag).toBe("Cold");

			const second = observe(cell.signal);
			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 5));
			yield* waitFor(() => {
				expect(second.seen).toEqual([Pending, ready(5, "5", 1)]);
			});
		}),
	);

	test(
		"fails the cell with FieldUnavailable when a publish does not decode, and goes Ready again on the next publish that does",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const { seen } = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(([m]) => m._tag === "subscribe"),
				).toBe(true);
			});

			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 5));
			yield* PubSub.publish(pubsub, snapshot("scoreLeft", "not a number", 2));
			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 7, 3));
			yield* waitFor(() => {
				expect(seen).toEqual([
					Pending,
					ready(5, "5", 1),
					Loadable.Failure({
						error: expect.objectContaining({
							_tag: "FieldUnavailable",
							namespace: "match",
							name: "scoreLeft",
							detail:
								"published value did not decode: Expected a finite number",
						}),
					}),
					ready(7, "7", 3),
				]);
			});
		}),
	);

	test(
		"drops a publish that lands after the field went cold",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const left = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);
			const right = yield* cells.replicant(
				"match",
				"scoreRight",
				namespace.replicant.scoreRight,
			);

			const leftObserved = observe(left.signal);
			const rightObserved = observe(right.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.filter(([m]) => m._tag === "subscribe"),
				).toHaveLength(2);
			});

			leftObserved.dispose();
			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 7));
			yield* PubSub.publish(pubsub, snapshot("scoreRight", 9));
			yield* waitFor(() => {
				expect(rightObserved.seen).toEqual([Pending, ready(9, "9", 1)]);
			});
			expect(leftObserved.seen).toEqual([Pending]);
			expect(left.peek()._tag).toBe("Cold");
		}),
	);

	test(
		"applies an op-delta on the held revision, and resyncs on a revision gap",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const { seen } = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(([m]) => m._tag === "subscribe"),
				).toBe(true);
			});

			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 0, 0));
			yield* PubSub.publish(
				pubsub,
				delta("scoreLeft", "5", 0, 1, computeFingerprint("5")),
			);
			yield* waitFor(() => {
				expect(seen).toEqual([Pending, ready(0, "0", 0), ready(5, "5", 1)]);
			});

			yield* PubSub.publish(
				pubsub,
				delta("scoreLeft", "9", 99, 100, computeFingerprint("9")),
			);
			yield* waitFor(() => {
				expect(channel.send).toHaveBeenCalledWith(resync);
			});
			expect(seen).toEqual([Pending, ready(0, "0", 0), ready(5, "5", 1)]);
		}),
	);

	test(
		"a delta arriving before the seed is dropped, not resynced",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const { seen } = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(([m]) => m._tag === "subscribe"),
				).toBe(true);
			});

			yield* PubSub.publish(
				pubsub,
				delta("scoreLeft", "5", 0, 1, computeFingerprint("5")),
			);
			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 7, 7));
			yield* waitFor(() => {
				expect(seen).toEqual([Pending, ready(7, "7", 7)]);
			});
			expect(channel.send).not.toHaveBeenCalledWith(resync);
		}),
	);

	test(
		"resyncs on a delta at or below the held revision, and the answering snapshot replaces the held value",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const { seen } = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(([m]) => m._tag === "subscribe"),
				).toBe(true);
			});

			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 1000, 1000));
			yield* PubSub.publish(
				pubsub,
				delta("scoreLeft", "4", 3, 4, computeFingerprint("4")),
			);
			yield* waitFor(() => {
				expect(channel.send).toHaveBeenCalledWith(resync);
			});
			expect(seen).toEqual([Pending, ready(1000, "1000", 1000)]);

			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 4, 4));
			yield* PubSub.publish(
				pubsub,
				delta("scoreLeft", "5", 4, 5, computeFingerprint("5")),
			);
			yield* waitFor(() => {
				expect(seen).toEqual([
					Pending,
					ready(1000, "1000", 1000),
					ready(4, "4", 4),
					ready(5, "5", 5),
				]);
			});
		}),
	);

	test(
		"resyncs when an applied delta's fingerprint mismatches the server's",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const { seen } = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(([m]) => m._tag === "subscribe"),
				).toBe(true);
			});

			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 0, 0));
			// Send wrong fingerprint
			yield* PubSub.publish(
				pubsub,
				delta("scoreLeft", "5", 0, 1, computeFingerprint("9")),
			);
			yield* waitFor(() => {
				expect(channel.send).toHaveBeenCalledWith(resync);
			});
			expect(seen).toEqual([Pending, ready(0, "0", 0)]);

			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 9, 1));
			yield* waitFor(() => {
				expect(seen).toEqual([Pending, ready(0, "0", 0), ready(9, "9", 1)]);
			});
		}),
	);

	test(
		"requests another resync when the snapshot answering the previous one does not decode",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const { seen } = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(([m]) => m._tag === "subscribe"),
				).toBe(true);
			});
			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 0, 0));

			const resyncs = () =>
				channel.send.mock.calls.filter(([m]) => m._tag === "resync").length;
			const gappedDelta = () =>
				delta("scoreLeft", "9", 99, 100, computeFingerprint("9"));

			yield* PubSub.publish(pubsub, gappedDelta());
			yield* waitFor(() => {
				expect(resyncs()).toBe(1);
			});

			yield* PubSub.publish(pubsub, snapshot("scoreLeft", "not a number", 100));
			yield* PubSub.publish(pubsub, gappedDelta());
			yield* waitFor(() => {
				expect(resyncs()).toBe(2);
			});

			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 7, 100));
			yield* waitFor(() => {
				expect(seen).toEqual([
					Pending,
					ready(0, "0", 0),
					Loadable.Failure({
						error: expect.objectContaining({
							_tag: "FieldUnavailable",
							namespace: "match",
							name: "scoreLeft",
							detail: expect.stringContaining("published value did not decode"),
						}),
					}),
					ready(7, "7", 100),
				]);
			});
		}),
	);

	test(
		"requests one resync however many gapped deltas arrive before the snapshot",
		Effect.gen(function* () {
			const pubsub = yield* PubSub.unbounded<ServerMessage>();
			channel.receive.mockReturnValue(
				PubSub.subscribe(pubsub).pipe(Effect.map(Stream.fromSubscription)),
			);
			const cells = yield* makeCells;
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);

			const { seen } = observe(cell.signal);
			yield* waitFor(() => {
				expect(
					channel.send.mock.calls.some(([m]) => m._tag === "subscribe"),
				).toBe(true);
			});
			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 0, 0));

			const resyncs = () =>
				channel.send.mock.calls.filter(([m]) => m._tag === "resync").length;
			const gapped = (baseRevision: number, revision: number) =>
				delta(
					"scoreLeft",
					String(revision),
					baseRevision,
					revision,
					computeFingerprint(String(revision)),
				);

			yield* PubSub.publish(pubsub, gapped(50, 51));
			yield* waitFor(() => {
				expect(resyncs()).toBe(1);
			});
			yield* PubSub.publish(pubsub, gapped(51, 52));
			yield* PubSub.publish(pubsub, gapped(52, 53));
			yield* PubSub.publish(pubsub, gapped(53, 54));
			yield* PubSub.publish(pubsub, snapshot("scoreLeft", 54, 54));
			yield* waitFor(() => {
				expect(seen).toEqual([Pending, ready(0, "0", 0), ready(54, "54", 54)]);
			});
			expect(resyncs()).toBe(1);
		}),
	);
});

describe("connection status", () => {
	const subscribeLeft = SubscribeMessage.make({
		field: { type: "replicant", namespace: "match", name: "scoreLeft" },
	});
	const subscribeRight = SubscribeMessage.make({
		field: { type: "replicant", namespace: "match", name: "scoreRight" },
	});

	test(
		"subscribes a field watched while disconnected once on connect",
		Effect.gen(function* () {
			const status =
				yield* SubscriptionRef.make<ConnectionStatus>("disconnected");
			const cells = yield* makeCells.pipe(
				Effect.provideService(MessageChannelService, {
					...channel,
					status: SubscriptionRef.changes(status),
				}),
			);
			const left = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);
			observe(left.signal);

			yield* SubscriptionRef.set(status, "connected");
			yield* waitFor(() => {
				expect(channel.send.mock.calls).toEqual([[subscribeLeft]]);
			});
			const right = yield* cells.replicant(
				"match",
				"scoreRight",
				namespace.replicant.scoreRight,
			);
			observe(right.signal);
			yield* waitFor(() => {
				expect(channel.send.mock.calls).toEqual([
					[subscribeLeft],
					[subscribeRight],
				]);
			});
		}),
	);

	test(
		"resubscribes watched fields after a reconnect",
		Effect.gen(function* () {
			const status = yield* SubscriptionRef.make<ConnectionStatus>("connected");
			const cells = yield* makeCells.pipe(
				Effect.provideService(MessageChannelService, {
					...channel,
					status: SubscriptionRef.changes(status),
				}),
			);
			const cell = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);
			observe(cell.signal);
			yield* waitFor(() => {
				expect(channel.send.mock.calls).toEqual([[subscribeLeft]]);
			});

			yield* SubscriptionRef.set(status, "disconnected");
			yield* SubscriptionRef.set(status, "connected");
			yield* waitFor(() => {
				expect(channel.send.mock.calls).toEqual([
					[subscribeLeft],
					[subscribeLeft],
				]);
			});
		}),
	);

	test(
		"leaves a field unwatched while disconnected out of the subscribe",
		Effect.gen(function* () {
			const status =
				yield* SubscriptionRef.make<ConnectionStatus>("disconnected");
			const cells = yield* makeCells.pipe(
				Effect.provideService(MessageChannelService, {
					...channel,
					status: SubscriptionRef.changes(status),
				}),
			);
			const left = yield* cells.replicant(
				"match",
				"scoreLeft",
				namespace.replicant.scoreLeft,
			);
			const right = yield* cells.replicant(
				"match",
				"scoreRight",
				namespace.replicant.scoreRight,
			);
			observe(left.signal).dispose();
			observe(right.signal);

			yield* SubscriptionRef.set(status, "connected");
			yield* waitFor(() => {
				expect(channel.send.mock.calls).toEqual([[subscribeRight]]);
			});
		}),
	);
});
