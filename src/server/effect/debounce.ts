import { Duration, Effect, Fiber, Option, SynchronizedRef } from "effect";

/**
 * Wraps a function in a debouncing mechanism that delays execution until
 * after a specified duration has passed since the last call.
 */
export const debounce = <A extends unknown[], E, R>(
	callback: (...args: A) => Effect.Effect<void, E, R>,
	duration: Duration.Duration,
) =>
	Effect.gen(function* () {
		const fiberRef = yield* SynchronizedRef.make(
			Option.none<Fiber.RuntimeFiber<void, E>>(),
		);

		return (...args: A) =>
			Effect.gen(function* () {
				// Atomic update of the fiber reference to ensure only one fiber runs at a time
				const fiber = yield* SynchronizedRef.updateAndGetEffect(
					fiberRef,
					(fiber) =>
						Effect.gen(function* () {
							if (Option.isSome(fiber)) {
								yield* Fiber.interrupt(fiber.value);
							}
							const newFiber = yield* Effect.forkScoped(
								Effect.gen(function* () {
									yield* Effect.sleep(duration);
									yield* callback(...args);
								}),
							);
							return Option.some(newFiber);
						}),
				);

				if (Option.isSome(fiber)) {
					yield* Fiber.join(fiber.value);
				}
			});
	});
