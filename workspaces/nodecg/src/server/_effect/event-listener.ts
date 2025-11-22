import { Effect, Queue, Stream } from "effect";

interface EventEmitterLike<T extends any[]> {
	once(event: string, listener: (...args: T) => void): unknown;
	addListener(event: string, listener: (...args: T) => void): unknown;
	removeListener(event: string, listener: (...args: T) => void): unknown;
}

export const waitForEvent = <T = never>(
	eventEmitter: EventEmitterLike<[NoInfer<T>]>,
	eventName: string,
) =>
	Effect.async<T>((resume) => {
		eventEmitter.once(eventName, (payload: T) => {
			resume(Effect.succeed(payload));
		});
	});

export const listenToEvent = <T = never>(
	eventEmitter: EventEmitterLike<[NoInfer<T>]>,
	eventName: string,
) =>
	Effect.gen(function* () {
		const queue = yield* Queue.bounded<T>(100);
		const handler = (payload: T) => {
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
