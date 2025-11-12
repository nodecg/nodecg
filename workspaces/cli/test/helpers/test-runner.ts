/**
 * Test runner helpers for Effect-based tests
 */
import { Effect, Layer } from "effect";
import { expect } from "vitest";

/**
 * Run an Effect with provided layers and return the result
 * Throws if the effect fails
 */
export const runEffect = <A, E, R>(
	effect: Effect.Effect<A, E, R>,
	layer: Layer.Layer<R, any, never>,
): Promise<A> => {
	return Effect.runPromise(Effect.provide(effect, layer));
};

/**
 * Run an Effect and expect it to fail with a specific error
 */
export const runEffectExpectError = async <A, E extends { _tag: string }, R>(
	effect: Effect.Effect<A, E, R>,
	layer: Layer.Layer<R, any, never>,
	expectedErrorTag: string,
): Promise<E> => {
	try {
		await Effect.runPromise(Effect.provide(effect, layer));
		throw new Error("Expected effect to fail but it succeeded");
	} catch (error: any) {
		// Effect wraps errors in a Cause structure, extract the actual error
		const actualError = error.cause?._tag === "Fail" ? error.cause.failure : error;
		expect(actualError._tag).toBe(expectedErrorTag);
		return actualError as E;
	}
};

/**
 * Run an Effect and expect it to succeed
 */
export const runEffectExpectSuccess = async <A, E, R>(
	effect: Effect.Effect<A, E, R>,
	layer: Layer.Layer<R, any, never>,
): Promise<A> => {
	return runEffect(effect, layer);
};

/**
 * Helper to create a test layer from multiple layers
 */
export const createTestLayer = <R>(...layers: Layer.Layer<any, any, any>[]): Layer.Layer<R, never, never> => {
	return Layer.mergeAll(...layers) as any;
};
