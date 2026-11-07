import { it } from "@effect/vitest";
import { PongMessage, ReplicantSnapshotMessage } from "@nodecg-next/internal";
import { Clock, Duration, Effect, Fiber, Layer, Schema } from "effect";
import { Socket } from "effect/socket";
import { TestClock } from "effect/testing";
import { assert, describe, expect, vi } from "vitest";

import { pingSilenceDetector } from "./ping-silence-detector.ts";
import { ConnectionIdle, SilenceDetectorService } from "./silence-detector.ts";

const makeFakeSocket = () => {
	const write = vi.fn<Socket.Writer["write"]>(() => Effect.void);
	const socket = Socket.make({
		reader: Effect.never,
		writer: Effect.succeed({ write, writeAll: vi.fn() }),
	});
	return { socket, write };
};

const makeDetectorLayer = (socket: Socket.Socket) =>
	pingSilenceDetector({
		interval: Duration.seconds(30),
		pongTimeout: Duration.seconds(15),
	}).pipe(Layer.provide(Layer.succeed(Socket.Socket, socket)));

describe("pingSilenceDetector", () => {
	it.effect("sends a ping every 30 seconds", () =>
		Effect.gen(function* () {
			const { socket, write } = makeFakeSocket();

			yield* Effect.gen(function* () {
				yield* TestClock.adjust("29999 millis");
				expect(write.mock.calls).toEqual([]);
				yield* TestClock.adjust("1 millis");
				expect(write.mock.calls).toEqual([['{"_tag":"ping"}']]);
				yield* TestClock.adjust("30 seconds");
				expect(write.mock.calls).toEqual([
					['{"_tag":"ping"}'],
					['{"_tag":"ping"}'],
				]);
			}).pipe(Effect.provide(makeDetectorLayer(socket)));
		}),
	);

	it.effect("reports silence 45 seconds after the last pong", () =>
		Effect.gen(function* () {
			const { socket } = makeFakeSocket();

			yield* Effect.gen(function* () {
				const silenceDetector = yield* SilenceDetectorService;
				yield* Effect.sleep("30 seconds").pipe(
					Effect.andThen(silenceDetector.onMessage(PongMessage.make({}))),
					Effect.forkChild,
				);
				const fiber = yield* Effect.gen(function* () {
					const error = yield* Effect.flip(silenceDetector.silence);
					const failedAt = yield* Clock.currentTimeMillis;
					return { error, failedAt };
				}).pipe(Effect.forkChild);

				yield* TestClock.adjust("75 seconds");
				const { error, failedAt } = yield* Fiber.join(fiber);
				expect(failedAt).toBe(75_000);
				assert(Schema.is(ConnectionIdle)(error));
				expect(error).toMatchObject({ timeout: Duration.seconds(45) });
			}).pipe(Effect.provide(makeDetectorLayer(socket)));
		}),
	);

	it.effect("ignores messages other than the pong", () =>
		Effect.gen(function* () {
			const { socket } = makeFakeSocket();

			yield* Effect.gen(function* () {
				const silenceDetector = yield* SilenceDetectorService;
				yield* Effect.sleep("30 seconds").pipe(
					Effect.andThen(
						silenceDetector.onMessage(
							ReplicantSnapshotMessage.make({
								field: { type: "replicant", namespace: "root", name: "count" },
								value: 42,
								revision: 3,
							}),
						),
					),
					Effect.forkChild,
				);
				const fiber = yield* Effect.gen(function* () {
					yield* Effect.flip(silenceDetector.silence);
					return yield* Clock.currentTimeMillis;
				}).pipe(Effect.forkChild);

				yield* TestClock.adjust("75 seconds");
				const failedAt = yield* Fiber.join(fiber);
				expect(failedAt).toBe(45_000);
			}).pipe(Effect.provide(makeDetectorLayer(socket)));
		}),
	);
});
