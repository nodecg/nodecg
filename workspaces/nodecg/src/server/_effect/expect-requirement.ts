import type { Brand, Effect } from "effect";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface MissingRequirement<R> extends Brand.Brand<"MissingRequirement" & R> {}

export const expectRequirement =
	<R>() =>
	<T, E, RR>(
		effect: [R] extends [RR] ? Effect.Effect<T, E, RR> : MissingRequirement<R>,
	) =>
		effect;
