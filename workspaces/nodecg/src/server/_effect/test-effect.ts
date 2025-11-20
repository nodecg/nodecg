import { Effect, Scope } from "effect";

export function testEffect<A, E>(self: Effect.Effect<A, E, Scope.Scope>) {
	return async () => {
		await Effect.runPromise(Effect.scoped(self));
	};
}
