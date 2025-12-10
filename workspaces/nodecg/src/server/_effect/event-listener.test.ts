import EventEmitter from "node:events";

import { Array, Chunk, Effect, Option, Stream } from "effect";
import { describe, expect, test, vi } from "vitest";

import { listenToEvent, waitForEvent } from "./event-listener";
import { testEffect } from "./test-effect";

class SimpleEventEmitter extends EventEmitter<{
	ping: [number];
	pong: [string];
}> {
	#pingCount = 0;
	#pingInterval?: NodeJS.Timeout;
	start() {
		this.#pingInterval = setInterval(() => {
			this.emit("ping", this.#pingCount);
			this.#pingCount += 1;
			if (this.#pingCount >= 5) {
				this.stop();
			}
		}, 10);
	}
	stop() {
		clearInterval(this.#pingInterval);
	}
}

const getNewEE = () =>
	Effect.acquireRelease(
		Effect.sync(() => new SimpleEventEmitter()),
		(ee) => Effect.sync(() => ee.stop()),
	);

describe("waitForEvent", () => {
	test(
		"waits for single event",
		testEffect(
			Effect.gen(function* () {
				const ee = yield* getNewEE();

				vi.spyOn(ee, "stop");
				vi.spyOn(ee, "removeListener");

				ee.start();

				const ping = yield* waitForEvent<[number]>(ee, "ping");
				expect(ping).toEqual([0]);

				return ee;
			}).pipe(
				Effect.scoped,
				Effect.andThen((ee) => {
					expect(ee.stop).toHaveBeenCalledOnce();
					expect(ee.removeListener).toHaveBeenCalledOnce();
					expect(ee.listenerCount("ping")).toBe(0);
				}),
			),
		),
	);
});

describe("listenToEvent", () => {
	test(
		"streams multiple events",
		testEffect(
			Effect.gen(function* () {
				const ee = yield* getNewEE();

				vi.spyOn(ee, "stop");
				vi.spyOn(ee, "removeListener");

				const pingStream = yield* listenToEvent<[number]>(ee, "ping");

				ee.start();

				const pings = yield* Stream.take(pingStream, 3).pipe(
					Stream.map(Array.head),
					Stream.map(Option.getOrThrow),
					Stream.runCollect,
					Effect.andThen(Chunk.toReadonlyArray),
				);

				expect(pings).toEqual([0, 1, 2]);

				return ee;
			}).pipe(
				Effect.scoped,
				Effect.andThen((ee) => {
					expect(ee.stop).toHaveBeenCalledOnce();
					expect(ee.removeListener).toHaveBeenCalledOnce();
					expect(ee.listenerCount("ping")).toBe(0);
				}),
			),
		),
	);
});
