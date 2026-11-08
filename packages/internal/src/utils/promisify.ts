import { Effect, HKT, Stream } from "effect";
import type { Promisable } from "type-fest";

type Subscribe<A, E> = (
	callback: (value: A, oldValue: A | undefined) => Promisable<void>,
	onError?: (error: E) => void,
) => Promise<() => Promise<void>>;

type SubscribeTopic<A, E> = (
	callback: (value: A) => Promisable<void>,
	onError?: (error: E) => void,
) => Promise<() => Promise<void>>;

export interface EffectToPromiseLambda extends HKT.TypeLambda {
	type: this["Target"] extends (
		...args: infer Args
	) => Effect.Effect<infer A, any, any>
		? (...args: Args) => Promise<A>
		: this["Target"] extends Effect.Effect<infer A, any, any>
			? Promise<A>
			: never;
}

export interface EffectToSyncLambda extends HKT.TypeLambda {
	type: this["Target"] extends (
		...args: infer Args
	) => Effect.Effect<infer A, any, any>
		? (...args: Args) => A
		: this["Target"] extends Effect.Effect<infer A, any, any>
			? A
			: never;
}

export interface StreamToSubscribeLambda extends HKT.TypeLambda {
	type: this["Target"] extends () => Effect.Effect<
		Stream.Stream<infer A, infer E, any>,
		any,
		any
	>
		? Subscribe<A, E>
		: never;
}

export interface StreamToSubscribeTopicLambda extends HKT.TypeLambda {
	type: this["Target"] extends () => Effect.Effect<
		Stream.Stream<infer A, infer E, any>,
		any,
		any
	>
		? SubscribeTopic<A, E>
		: never;
}

export interface IdentityLambda extends HKT.TypeLambda {
	type: this["Target"];
}

export type ApplyLambdaToObject<
	T,
	M extends { [K in keyof T]: HKT.TypeLambda },
> = {
	[K in keyof T]: HKT.Kind<M[K], unknown, never, never, T[K]>;
};
