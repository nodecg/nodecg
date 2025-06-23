import { Chunk, Deferred, Duration, Effect, pipe, Queue, Stream } from "effect";

/**
 * Wraps a function in a throttling mechanism that limits the number of calls
 * to the function within a specified duration.
 */
export const throttle = <T, A extends unknown[], E, R>(
	callback: (...args: A) => Effect.Effect<T, E, R>,
	duration: Duration.Duration,
) =>
	Effect.gen(function* () {
		const queue = yield* Queue.unbounded<{
			args: A;
			deferred: Deferred.Deferred<T, E>;
		}>();
		const stream = Stream.fromQueue(queue, { maxChunkSize: 1 }).pipe(
			Stream.throttle({
				duration,
				cost: Chunk.size,
				units: 1,
			}),
			Stream.mapEffect(({ args, deferred }) =>
				pipe(
					callback(...args),
					Effect.flatMap((result) => Deferred.succeed(deferred, result)),
					Effect.catchAll((result) => Deferred.fail(deferred, result)),
					Effect.asVoid,
				),
			),
		);

		yield* Effect.forkScoped(Stream.runDrain(stream));

		return (...args: A) =>
			Effect.gen(function* () {
				const deferred = yield* Deferred.make<T, E>();
				yield* Queue.offer(queue, { args, deferred });
				return yield* Deferred.await(deferred);
			});
	});
