import { it } from "@effect/vitest";
import {
	type FieldIdentifier,
	ReplicantSnapshotMessage,
	ServerMessage,
	SubscribeMessage,
} from "@nodecg-next/internal";
import {
	Deferred,
	Duration,
	Effect,
	Fiber,
	Layer,
	Option,
	Schema,
	Stream,
} from "effect";
import { Socket } from "effect/socket";
import { TestClock } from "effect/testing";
import { afterEach, assert, describe, expect, vi } from "vitest";

import {
	ConnectionIdle,
	type SilenceDetector,
	SilenceDetectorService,
} from "../silence-detector/silence-detector.ts";
import { MessageChannelService } from "./message-channel.ts";
import { SocketMessageChannel } from "./socket-message-channel.ts";

const makeFakeSocket = () => {
	const write = vi.fn<Socket.Writer["write"]>(() => Effect.void);
	const pull = vi.fn<() => Socket.Reader["pull"]>(() => Effect.never);
	const open = Effect.succeed({ pull: Effect.suspend(pull), upgrade: vi.fn() });
	const reader = vi.fn<() => Socket.Socket["reader"]>(() => open);
	const socket = Socket.make({
		reader: Effect.suspend(reader),
		writer: Effect.succeed({ write, writeAll: vi.fn() }),
	});
	return { socket, write, pull, open, reader };
};

const closed = Effect.fail(
	Socket.SocketError.make({
		reason: Socket.SocketReadError.make({ cause: new Error("simulated") }),
	}),
);

const refused = Effect.fail(
	Socket.SocketError.make({
		reason: Socket.SocketOpenError.make({
			kind: "Unknown",
			cause: new Error("simulated"),
		}),
	}),
);

const onMessage = vi.fn<SilenceDetector["onMessage"]>(() => Effect.void);
const silence = vi.fn<() => SilenceDetector["silence"]>(() => Effect.never);
afterEach(() => {
	onMessage.mockReset();
	silence.mockReset();
});
const silenceDetector: SilenceDetector = {
	onMessage,
	silence: Effect.suspend(silence),
};

const makeChannelLayer = (socket: Socket.Socket) =>
	SocketMessageChannel.pipe(
		Layer.provide(Layer.succeed(Socket.Socket, socket)),
	);

const waitFor = (assertion: () => void) =>
	Effect.promise(() => vi.waitFor(assertion));

const countField: FieldIdentifier = {
	type: "replicant",
	namespace: "root",
	name: "count",
};

const encodeServerMessage = Schema.encodeSync(
	Schema.fromJsonString(ServerMessage),
);
const decodeWrittenJson = Schema.decodeUnknownEffect(
	Schema.fromJsonString(Schema.Json),
);

const countSnapshot = encodeServerMessage(
	ReplicantSnapshotMessage.make({ field: countField, value: 42, revision: 3 }),
);

describe("send", () => {
	it.effect("encodes ClientMessage and writes JSON to the socket", () =>
		Effect.gen(function* () {
			const { socket, write } = makeFakeSocket();

			yield* Effect.gen(function* () {
				const channel = yield* MessageChannelService;
				yield* channel.send(SubscribeMessage.make({ field: countField }));
			}).pipe(Effect.provide(makeChannelLayer(socket)));

			const written = yield* Effect.forEach(write.mock.calls, ([data]) =>
				decodeWrittenJson(data),
			);
			expect(written).toEqual([
				{
					_tag: "subscribe",
					field: { type: "replicant", namespace: "root", name: "count" },
				},
			]);
		}),
	);

	it.effect("drops a message the socket fails to write and keeps sending", () =>
		Effect.gen(function* () {
			const { socket, write } = makeFakeSocket();
			write.mockReturnValueOnce(
				Effect.fail(
					Socket.SocketError.make({
						reason: Socket.SocketWriteError.make({
							cause: new Error("simulated"),
						}),
					}),
				),
			);

			yield* Effect.gen(function* () {
				const channel = yield* MessageChannelService;
				yield* channel.send(SubscribeMessage.make({ field: countField }));
				yield* channel.send(
					SubscribeMessage.make({
						field: { type: "replicant", namespace: "root", name: "total" },
					}),
				);
			}).pipe(Effect.provide(makeChannelLayer(socket)));

			const written = yield* Effect.forEach(write.mock.calls, ([data]) =>
				decodeWrittenJson(data),
			);
			expect(written).toEqual([
				{
					_tag: "subscribe",
					field: { type: "replicant", namespace: "root", name: "count" },
				},
				{
					_tag: "subscribe",
					field: { type: "replicant", namespace: "root", name: "total" },
				},
			]);
		}),
	);
});

describe("status", () => {
	it.effect("reports each connect and drop in order", () =>
		Effect.gen(function* () {
			const { socket, pull, open, reader } = makeFakeSocket();
			const openFirst = yield* Deferred.make<void>();
			reader.mockReturnValueOnce(
				Deferred.await(openFirst).pipe(Effect.andThen(open)),
			);
			pull.mockReturnValueOnce(closed);

			yield* Effect.gen(function* () {
				const channel = yield* MessageChannelService;
				const seen = yield* channel.status.pipe(
					Stream.tap(() => Deferred.succeed(openFirst, undefined)),
					Stream.take(4),
					Stream.runCollect,
					Effect.forkChild,
				);
				yield* Deferred.await(openFirst);
				yield* TestClock.adjust("1200 millis");

				const statuses = yield* Fiber.join(seen);
				expect(statuses).toEqual([
					"disconnected",
					"connected",
					"disconnected",
					"connected",
				]);
			}).pipe(Effect.provide(makeChannelLayer(socket)));
		}),
	);
});

describe("receive", () => {
	it.effect(
		"decodes incoming JSON frames into ServerMessage stream values",
		() =>
			Effect.gen(function* () {
				const { socket, pull } = makeFakeSocket();
				const subscribed = yield* Deferred.make<void>();
				pull.mockReturnValueOnce(
					Deferred.await(subscribed).pipe(Effect.as([countSnapshot] as const)),
				);

				yield* Effect.gen(function* () {
					const channel = yield* MessageChannelService;
					const stream = yield* channel.receive();
					yield* Deferred.succeed(subscribed, undefined);

					const first = yield* Stream.runHead(stream);
					assert(Option.isSome(first));
					expect(first.value).toEqual({
						_tag: "snapshot",
						field: { type: "replicant", namespace: "root", name: "count" },
						value: 42,
						revision: 3,
					});
				}).pipe(Effect.provide(makeChannelLayer(socket)));
			}),
	);

	it.effect(
		"ends receive and status streams when the connection loop dies",
		() =>
			Effect.gen(function* () {
				const { socket, reader } = makeFakeSocket();
				const crash = yield* Deferred.make<void>();
				reader.mockReturnValueOnce(
					Deferred.await(crash).pipe(
						Effect.andThen(Effect.die(new Error("simulated"))),
					),
				);

				yield* Effect.gen(function* () {
					const channel = yield* MessageChannelService;
					const messages = yield* channel.receive();
					const statuses = yield* channel.status.pipe(
						Stream.tap(() => Deferred.succeed(crash, undefined)),
						Stream.runCollect,
						Effect.forkChild,
					);

					const received = yield* Stream.runCollect(messages);
					const seen = yield* Fiber.join(statuses);
					expect(received).toEqual([]);
					expect(seen).toEqual(["disconnected"]);
				}).pipe(Effect.provide(makeChannelLayer(socket)));
			}),
	);

	it.effect("ends the stream when the channel scope closes", () =>
		Effect.gen(function* () {
			const { socket } = makeFakeSocket();

			const stream = yield* Effect.gen(function* () {
				const channel = yield* MessageChannelService;
				return yield* channel.receive();
			}).pipe(Effect.provide(makeChannelLayer(socket)));

			const all = yield* Stream.runCollect(stream);
			expect(all).toEqual([]);
		}),
	);

	it.effect(
		"drops malformed JSON and binary frames without failing the stream",
		() =>
			Effect.gen(function* () {
				const { socket, pull } = makeFakeSocket();
				const subscribed = yield* Deferred.make<void>();
				pull.mockReturnValueOnce(
					Deferred.await(subscribed).pipe(
						Effect.as([
							"not valid json",
							new Uint8Array([1, 2, 3]),
							countSnapshot,
						] as const),
					),
				);

				yield* Effect.gen(function* () {
					const channel = yield* MessageChannelService;
					const stream = yield* channel.receive();
					yield* Deferred.succeed(subscribed, undefined);

					const first = yield* Stream.runHead(stream);
					assert(Option.isSome(first));
					expect(first.value).toEqual({
						_tag: "snapshot",
						field: { type: "replicant", namespace: "root", name: "count" },
						value: 42,
						revision: 3,
					});
				}).pipe(Effect.provide(makeChannelLayer(socket)));
			}),
	);
});

describe("reconnect", () => {
	it.effect("keeps a receive stream going across a reconnect", () =>
		Effect.gen(function* () {
			const { socket, pull } = makeFakeSocket();
			pull
				.mockReturnValueOnce(closed)
				.mockReturnValueOnce(Effect.succeed([countSnapshot] as const));

			yield* Effect.gen(function* () {
				const channel = yield* MessageChannelService;
				const stream = yield* channel.receive();
				yield* TestClock.adjust("1200 millis");

				const head = yield* Stream.runHead(stream);
				assert(Option.isSome(head));
				expect(head.value).toEqual({
					_tag: "snapshot",
					field: { type: "replicant", namespace: "root", name: "count" },
					value: 42,
					revision: 3,
				});
			}).pipe(Effect.provide(makeChannelLayer(socket)));
		}),
	);

	it.effect("reconnects when the connection goes silent", () =>
		Effect.gen(function* () {
			const { socket, reader } = makeFakeSocket();
			silence.mockReturnValueOnce(
				Effect.fail(ConnectionIdle.make({ timeout: Duration.seconds(45) })),
			);

			yield* Effect.gen(function* () {
				yield* MessageChannelService;
				yield* waitFor(() => expect(reader).toHaveBeenCalledTimes(1));
				yield* TestClock.adjust("1200 millis");
				yield* waitFor(() => expect(reader).toHaveBeenCalledTimes(2));
			}).pipe(
				Effect.provide(makeChannelLayer(socket)),
				Effect.provideService(SilenceDetectorService, silenceDetector),
			);
		}),
	);

	it.effect("reports each decoded message to the silence detector", () =>
		Effect.gen(function* () {
			const { socket, pull } = makeFakeSocket();
			pull.mockReturnValueOnce(
				Effect.succeed(["not valid json", countSnapshot] as const),
			);

			yield* Effect.gen(function* () {
				yield* MessageChannelService;
				yield* waitFor(() =>
					expect(onMessage.mock.calls).toEqual([
						[
							{
								_tag: "snapshot",
								field: { type: "replicant", namespace: "root", name: "count" },
								value: 42,
								revision: 3,
							},
						],
					]),
				);
			}).pipe(
				Effect.provide(makeChannelLayer(socket)),
				Effect.provideService(SilenceDetectorService, silenceDetector),
			);
		}),
	);

	it.effect("resets the backoff after a successful open", () =>
		Effect.gen(function* () {
			const { socket, pull, open, reader } = makeFakeSocket();
			const refuseAgain = yield* Deferred.make<void>();
			reader
				.mockReturnValueOnce(refused)
				.mockReturnValueOnce(open)
				.mockReturnValueOnce(
					Deferred.await(refuseAgain).pipe(Effect.andThen(refused)),
				);
			pull.mockReturnValueOnce(closed);

			yield* Effect.gen(function* () {
				yield* MessageChannelService;
				yield* waitFor(() => expect(reader).toHaveBeenCalledTimes(1));
				yield* TestClock.adjust("120 millis");
				yield* waitFor(() => expect(reader).toHaveBeenCalledTimes(2));

				yield* TestClock.adjust("1200 millis");
				yield* waitFor(() => expect(reader).toHaveBeenCalledTimes(3));
				yield* Deferred.succeed(refuseAgain, undefined);
				yield* TestClock.adjust("120 millis");
				yield* waitFor(() => expect(reader).toHaveBeenCalledTimes(4));
			}).pipe(Effect.provide(makeChannelLayer(socket)));
		}),
	);
});
