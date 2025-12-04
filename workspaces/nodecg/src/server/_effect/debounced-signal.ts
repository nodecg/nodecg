import {
	Deferred,
	type Duration,
	Effect,
	Fiber,
	SynchronizedRef,
} from "effect";

/**
 * Creates a debounced signal that completes after a period of inactivity.
 *
 * - Call `reset()` to restart the timer
 * - The signal completes when `duration` passes without any `reset()` calls
 * - Once completed, further `reset()` calls are no-ops
 * - Use `await()` to wait for completion
 * - Use `isDone()` to check if already completed
 */
export const debouncedSignal = Effect.fn("debouncedSignal")(function* (
	duration: Duration.DurationInput,
) {
	const deferred = yield* Deferred.make<void>();

	const scope = yield* Effect.scope;
	const startTimer = () =>
		Effect.sleep(duration).pipe(
			Effect.andThen(Deferred.succeed(deferred, undefined)),
			Effect.forkIn(scope),
		);
	const timerFiber = yield* SynchronizedRef.make(yield* startTimer());

	const reset = Effect.fn(function* () {
		const isDone = yield* Deferred.isDone(deferred);
		if (isDone) {
			return;
		}
		yield* SynchronizedRef.updateEffect(timerFiber, (current) =>
			Effect.gen(function* () {
				yield* Fiber.interrupt(current);
				return yield* startTimer();
			}),
		);
	});

	const await = () => Deferred.await(deferred);

	return {
		reset,
		await,
	};
});
