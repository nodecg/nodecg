import { Effect, Exit, Match, Scope } from "effect";

export function testEffect<A, E>(self: Effect.Effect<A, E, Scope.Scope>) {
	return async () => {
		const exit = await Effect.runPromise(self.pipe(Effect.scoped, Effect.exit));
		if (Exit.isSuccess(exit)) {
			return;
		}
		const error = Match.value(exit.cause).pipe(
			Match.tag("Die", ({ defect }) => defect),
			Match.tag("Fail", ({ error }) => error),
			Match.tag("Interrupt", () => new Error("test interrupted")),
			Match.tag(
				"Parallel",
				() => new Error("test failed with parallel causes", { cause: exit }),
			),
			Match.tag(
				"Sequential",
				() => new Error("test failed with parallel causes", { cause: exit }),
			),
			Match.tag(
				"Empty",
				() => new Error("test failed with empty causes", { cause: exit }),
			),
			Match.exhaustive,
		);
		throw error;
	};
}
