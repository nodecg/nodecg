import { Effect } from "effect";
import { describe, expectTypeOf, test } from "vitest";

import { expectRequirement } from "./expect-requirement.js";

class FooService extends Effect.Service<FooService>()("FooService", {
	effect: Effect.succeed({ foo: "bar" }),
}) {}

class BarService extends Effect.Service<BarService>()("BarService", {
	effect: Effect.succeed({ bar: "baz" }),
}) {}

describe("expectRequirement", () => {
	test("accepts Effect that has the required service", () => {
		const effectWithFoo = FooService.pipe(Effect.map(() => "ok"));
		const result = effectWithFoo.pipe(expectRequirement<FooService>());
		expectTypeOf(result).toEqualTypeOf<
			Effect.Effect<string, never, FooService>
		>();
	});

	test("works in Effect.fn as 2nd+ argument", () => {
		const fn = Effect.fn(function* () {
			yield* FooService;
			return "ok";
		}, expectRequirement<FooService>());
		expectTypeOf(fn).toEqualTypeOf<
			() => Effect.Effect<string, never, FooService>
		>();
	});

	test("works with Effect with extra requirements", () => {
		const effectWithBoth = Effect.all([FooService, BarService]).pipe(
			Effect.map(() => "ok"),
		);
		const result = effectWithBoth.pipe(expectRequirement<FooService>());
		expectTypeOf(result).toEqualTypeOf<
			Effect.Effect<string, never, FooService | BarService>
		>();
	});

	test("rejects Effect without required service", () => {
		const effectWithoutFoo = Effect.succeed("ok");
		// @ts-expect-error - Effect<string, never, never> is missing FooService
		effectWithoutFoo.pipe(expectRequirement<FooService>());
	});

	test("rejects Effect with wrong service requirement", () => {
		const effectWithBar = BarService.pipe(Effect.map(() => "ok"));
		// @ts-expect-error - Effect with BarService does not satisfy FooService
		effectWithBar.pipe(expectRequirement<FooService>());
	});
});
