import { it } from "@effect/vitest";
import { Effect, Option, Result, Stream } from "effect";
import { expect } from "vitest";

import { zipPreviousSuccess } from "./zip-previous-success.ts";

it.effect("pairs each success with the success before it", () =>
	Effect.gen(function* () {
		const elements = yield* Stream.make(
			Result.succeed(1),
			Result.fail("down"),
			Result.succeed(2),
			Result.succeed(3),
		).pipe(zipPreviousSuccess, Stream.runCollect);

		expect(elements).toEqual([
			Result.succeed([Option.none(), 1]),
			Result.fail("down"),
			Result.succeed([Option.some(1), 2]),
			Result.succeed([Option.some(2), 3]),
		]);
	}),
);
