import { describe, expect, it, vi } from "@effect/vitest";
import {
	Duration,
	Effect,
	Either,
	Fiber,
	FiberStatus,
	TestClock,
} from "effect";

import { debounce } from "./debounce.js";

describe("debounce", { timeout: 1000 }, () => {
	it.scoped("should delay execution until after duration", () =>
		Effect.gen(function* () {
			const spy = vi.fn();
			const debouncedFn = yield* debounce((n: number) => {
				spy(n);
				return Effect.void;
			}, Duration.millis(100));

			// Call multiple times quickly
			yield* Effect.fork(
				Effect.all(
					[
						debouncedFn(1),
						debouncedFn(2),
						debouncedFn(3),
						debouncedFn(4),
						debouncedFn(5),
					],
					{ concurrency: "unbounded" },
				),
			);

			// Should not execute immediately
			expect(spy).not.toHaveBeenCalled();

			// Advance time by less than debounce duration
			yield* TestClock.adjust(Duration.millis(50));
			expect(spy).not.toHaveBeenCalled();

			// Advance time to complete debounce duration
			yield* TestClock.adjust(Duration.millis(50));
			expect(spy).toHaveBeenCalledTimes(1);

			// Advance time again to ensure no further calls
			yield* TestClock.adjust(Duration.millis(1000));
			expect(spy).toHaveBeenCalledTimes(1);
		}),
	);

	it.scoped("should cancel previous timeout when called again", () =>
		Effect.gen(function* () {
			let callCount = 0;
			const callback = vi.fn(() =>
				Effect.sync(() => {
					callCount++;
				}),
			);

			const debouncedFn = yield* debounce(callback, Duration.millis(100));

			// Start first call
			const fiber1 = yield* Effect.fork(debouncedFn());

			// Wait less than debounce duration
			yield* TestClock.adjust(Duration.millis(50));
			expect(callback).toHaveBeenCalledTimes(0);

			// Second call should cancel the first
			yield* Effect.fork(debouncedFn());
			const fiber1Status = yield* Fiber.status(fiber1);
			expect(FiberStatus.isSuspended(fiber1Status)).toBe(true);

			// Complete the debounce duration for the second call
			yield* TestClock.adjust(Duration.millis(100));

			// Should only execute once (the second call)
			expect(callback).toHaveBeenCalledTimes(1);
			expect(callCount).toBe(1);
		}),
	);

	it.scoped("should handle errors properly", () =>
		Effect.gen(function* () {
			const error = new Error("test error");
			const callback = vi.fn(() => Effect.fail(error));
			const debouncedFn = yield* debounce(callback, Duration.millis(100));

			const fiber = yield* Effect.fork(debouncedFn());
			yield* TestClock.adjust(Duration.millis(100));

			const result = yield* Effect.either(Fiber.join(fiber));

			expect(Either.isLeft(result)).toBe(true);
			if (Either.isLeft(result)) {
				expect(result.left).toBe(error);
			}
			expect(callback).toHaveBeenCalledTimes(1);
		}),
	);

	it.scoped("should clean up resources on scope exit", () =>
		Effect.gen(function* () {
			const callback = vi.fn(() => Effect.void);

			// Create and immediately exit scope
			yield* Effect.scoped(
				Effect.gen(function* () {
					const debouncedFn = yield* debounce(callback, Duration.millis(100));
					yield* Effect.fork(debouncedFn());
					yield* TestClock.adjust(Duration.millis(10));
				}),
			);

			// Wait longer than debounce duration
			yield* TestClock.adjust(Duration.millis(200));

			// Callback should not have been called due to cleanup
			expect(callback).toHaveBeenCalledTimes(0);
		}),
	);

	it.scoped("should pass arguments correctly", () =>
		Effect.gen(function* () {
			let calledArgs: string | undefined;
			const callback = vi.fn((a: number, b: string) => {
				calledArgs = `${a}-${b}`;
				return Effect.void;
			});

			const debouncedFn = yield* debounce(callback, Duration.millis(100));
			yield* Effect.fork(debouncedFn(42, "test"));

			yield* TestClock.adjust(Duration.millis(50));
			expect(callback).not.toHaveBeenCalled();
			expect(calledArgs).toBeUndefined();

			yield* TestClock.adjust(Duration.millis(50));

			expect(callback).toHaveBeenCalledWith(42, "test");
			expect(calledArgs).toBe("42-test");
		}),
	);
});
