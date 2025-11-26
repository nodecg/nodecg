import { Cause, Effect, Exit, Scope } from "effect";

export function testEffect<A, E>(self: Effect.Effect<A, E, Scope.Scope>) {
	return async () => {
		const exit = await Effect.runPromise(self.pipe(Effect.scoped, Effect.exit));
		Exit.match(exit, {
			onSuccess: () => {
				// Test passed
			},
			onFailure: Cause.match({
				onDie: (defect) => {
					throw defect;
				},
				onFail: (error) => {
					// eslint-disable-next-line @typescript-eslint/only-throw-error
					throw error;
				},
				onInterrupt: () => {
					throw new Error("Test interrupted");
				},
				onParallel: () => {
					throw new Error(`Test failed with parallel causes`, { cause: exit });
				},
				onSequential: () => {
					throw new Error(`Test failed with sequential causes`, {
						cause: exit,
					});
				},
				onEmpty: () => {
					throw new Error("Test failed with empty cause");
				},
			}),
		});
	};
}
