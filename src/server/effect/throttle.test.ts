import {
	Duration,
	Effect,
	Fiber,
	pipe,
	Scope,
	TestClock,
	TestContext,
} from "effect";
import { describe, expect, it } from "vitest";

import { throttle } from "./throttle";

describe("throttle", () => {
	const run = <A, E>(effect: Effect.Effect<A, E, Scope.Scope>) =>
		Effect.runPromise(
			pipe(effect, Effect.scoped, Effect.provide(TestContext.TestContext)),
		);

	it("should execute callback and return result", async () => {
		await run(
			Effect.gen(function* () {
				const throttled = yield* throttle(
					(x: number) => Effect.succeed(x * 2),
					Duration.millis(100),
				);

				const fiber = yield* Effect.fork(throttled(5));

				// Advance time to allow the first call to execute immediately
				yield* TestClock.adjust(Duration.millis(1));

				const result = yield* Fiber.join(fiber);
				expect(result).toBe(10);
			}),
		);
	});

	it("should throttle rapid calls", async () => {
		await run(
			Effect.gen(function* () {
				const executions: number[] = [];
				const throttled = yield* throttle(
					(x: number) =>
						Effect.sync(() => {
							executions.push(x);
							return x;
						}),
					Duration.millis(100),
				);

				// Fork all calls at once (simulating rapid calls)
				const fiber1 = yield* Effect.fork(throttled(1));
				const fiber2 = yield* Effect.fork(throttled(2));
				const fiber3 = yield* Effect.fork(throttled(3));

				// At time 0, nothing should have executed yet
				expect(executions).toHaveLength(0);

				// First call executes immediately when time advances
				yield* TestClock.adjust(Duration.millis(1));
				expect(executions).toEqual([1]);

				// Second call waits for throttle duration (100ms)
				yield* TestClock.adjust(Duration.millis(99));
				expect(executions).toEqual([1, 2]);

				// Third call waits another 100ms
				yield* TestClock.adjust(Duration.millis(100));
				expect(executions).toEqual([1, 2, 3]);

				// Verify all fibers completed
				const [r1, r2, r3] = yield* Effect.all([
					Fiber.join(fiber1),
					Fiber.join(fiber2),
					Fiber.join(fiber3),
				]);
				expect([r1, r2, r3]).toEqual([1, 2, 3]);
			}),
		);
	});

	it("should maintain argument-result correlation", async () => {
		await run(
			Effect.gen(function* () {
				const throttled = yield* throttle(
					(x: string) =>
						Effect.delay(Effect.succeed(`processed-${x}`), Duration.millis(50)),
					Duration.millis(100),
				);

				// Fork all calls at once
				const fibers = yield* Effect.all([
					Effect.fork(throttled("a")),
					Effect.fork(throttled("b")),
					Effect.fork(throttled("c")),
				]);

				// First call processes immediately + 50ms delay
				yield* TestClock.adjust(Duration.millis(51));

				// Second call processes at 100ms + 50ms delay
				yield* TestClock.adjust(Duration.millis(99));

				// Third call processes at 200ms + 50ms delay
				yield* TestClock.adjust(Duration.millis(100));

				// Check each got correct result
				const results = yield* Effect.all(fibers.map(Fiber.join));
				expect(results).toEqual(["processed-a", "processed-b", "processed-c"]);
			}),
		);
	});

	it("should propagate errors correctly", async () => {
		await run(
			Effect.gen(function* () {
				const throttled = yield* throttle(
					(x: number) => (x < 0 ? Effect.fail("negative") : Effect.succeed(x)),
					Duration.millis(100),
				);

				// Fork all calls
				const fiber1 = yield* Effect.fork(throttled(1));
				const fiber2 = yield* Effect.fork(throttled(-1));
				const fiber3 = yield* Effect.fork(throttled(3));

				yield* TestClock.adjust(Duration.millis(1)); // First call
				const result1 = yield* Fiber.join(fiber1);
				expect(result1).toBe(1);

				yield* TestClock.adjust(Duration.millis(99)); // Second call (error)
				const result2 = yield* Effect.either(Fiber.join(fiber2));
				expect(result2).toEqual({ left: "negative" });

				yield* TestClock.adjust(Duration.millis(100)); // Third call
				const result3 = yield* Fiber.join(fiber3);
				expect(result3).toBe(3);
			}),
		);
	});

	it("should handle cleanup and interrupt pending calls", async () => {
		await run(
			Effect.gen(function* () {
				const results: string[] = [];

				yield* Effect.scoped(
					Effect.gen(function* () {
						const throttled = yield* throttle(
							(x: string) =>
								Effect.sync(() => {
									results.push(x);
									return x;
								}),
							Duration.millis(100),
						);

						// Fork multiple calls
						yield* Effect.fork(throttled("a"));
						yield* Effect.fork(throttled("b"));
						yield* Effect.fork(throttled("c"));

						// Advance time to let first call execute
						yield* TestClock.adjust(Duration.millis(1));
						expect(results).toEqual(["a"]);

						// Exit scope before other calls can execute
						// (they would execute at 100ms and 200ms)
					}),
				);

				// Only first call completed before scope cleanup
				yield* TestClock.adjust(Duration.millis(200));
				expect(results).toEqual(["a"]);
			}),
		);
	});

	it("should process calls in FIFO order", async () => {
		await run(
			Effect.gen(function* () {
				const order: number[] = [];
				const throttled = yield* throttle(
					(x: number) =>
						Effect.sync(() => {
							order.push(x);
							return x;
						}),
					Duration.millis(100),
				);

				// Fork all calls at once to queue them
				yield* Effect.all([
					Effect.fork(throttled(1)),
					Effect.fork(throttled(2)),
					Effect.fork(throttled(3)),
					Effect.fork(throttled(4)),
				]);

				// Step through time to see throttling in action
				expect(order).toEqual([]); // Nothing executed yet

				yield* TestClock.adjust(Duration.millis(1)); // t=1: first call
				expect(order).toEqual([1]);

				yield* TestClock.adjust(Duration.millis(99)); // t=100: second call
				expect(order).toEqual([1, 2]);

				yield* TestClock.adjust(Duration.millis(100)); // t=200: third call
				expect(order).toEqual([1, 2, 3]);

				yield* TestClock.adjust(Duration.millis(100)); // t=300: fourth call
				expect(order).toEqual([1, 2, 3, 4]);
			}),
		);
	});
});
