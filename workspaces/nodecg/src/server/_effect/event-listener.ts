import { Effect, Match, Predicate, Queue, Stream } from "effect";

interface EventEmitterLike<T extends any[]> {
	once(event: string, listener: (...args: T) => void): unknown;
	addListener(event: string, listener: (...args: T) => void): unknown;
	removeListener(event: string, listener: (...args: T) => void): unknown;
}

export const waitForEvent = <T extends any[] = never[]>(
	eventEmitter: EventEmitterLike<NoInfer<T>>,
	eventName: string,
) =>
	Effect.async<T>((resume) => {
		eventEmitter.once(eventName, (...payload: T) => {
			resume(Effect.succeed(payload));
		});
	});

export const listenToEvent = <T extends any[] = never[]>(
	eventEmitter: EventEmitterLike<NoInfer<T>>,
	eventName: string,
	boundary?: number,
) =>
	Effect.gen(function* () {
		const queue = yield* Match.value(boundary).pipe(
			Match.when(Predicate.isNumber, (b) => Queue.bounded<T>(b)),
			Match.when(Predicate.isUndefined, () => Queue.unbounded<T>()),
			Match.exhaustive,
		);
		const handler = (...payload: T) => {
			Queue.unsafeOffer(queue, payload);
		};
		eventEmitter.addListener(eventName, handler);
		yield* Effect.addFinalizer(() =>
			Effect.sync(() => {
				eventEmitter.removeListener(eventName, handler);
			}),
		);
		return Stream.fromQueue(queue);
	});
