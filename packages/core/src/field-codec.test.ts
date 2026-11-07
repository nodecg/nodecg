import type { StandardSchemaV1 } from "@standard-schema/spec";
import { Effect, Result, Schema, SchemaGetter } from "effect";
import { assert, describe, expect, test } from "vitest";
import { z } from "zod";

import { makeCodec } from "./field-codec.ts";

describe("makeCodec", () => {
	describe("Effect schema", () => {
		test("encodes and decodes with the schema", () => {
			const codec = makeCodec("count", Schema.FiniteFromString);

			expect(codec.encode(1)).toStrictEqual(Result.succeed("1"));
			expect(codec.decode("2")).toStrictEqual(Result.succeed(2));
		});

		test("fails to decode a value the schema refuses", () => {
			const codec = makeCodec("count", Schema.FiniteFromString);

			const decoded = codec.decode("nope");

			assert(Result.isFailure(decoded));
			expect(decoded.failure.message).toMatchInlineSnapshot(
				`"Failed to decode replicant "count": Expected a finite number"`,
			);
		});

		test("fails to decode with an asynchronous schema", () => {
			const schema = Schema.String.pipe(
				Schema.decode({
					decode: SchemaGetter.checkEffect(() =>
						Effect.promise(async () => true),
					),
					encode: SchemaGetter.passthrough(),
				}),
			);
			const codec = makeCodec("label", schema);

			const decoded = codec.decode("a");

			assert(Result.isFailure(decoded));
			expect(decoded.failure.message).toBe(
				'Failed to decode replicant "label": The schema threw instead of returning issues',
			);
		});

		test("mutableDecode shares nothing with the input", () => {
			const codec = makeCodec("score", Schema.Struct({ data: Schema.Json }));
			const input = { data: { tags: ["a"] } };

			const score = codec.mutableDecode(input);

			assert(Result.isSuccess(score));
			expect(score.success).toStrictEqual(input);
			expect(score.success.data).not.toBe(input.data);
		});
	});

	describe("Standard Schema", () => {
		test("encodes and decodes with the schema", () => {
			const codec = makeCodec("title", z.string().trim());

			expect(codec.encode(" final ")).toStrictEqual(Result.succeed("final"));
			expect(codec.decode(" semi ")).toStrictEqual(Result.succeed("semi"));
		});

		test("fails to encode a value the schema refuses", () => {
			const codec = makeCodec("round", z.number().min(1));

			const encoded = codec.encode(0);

			assert(Result.isFailure(encoded));
			expect(encoded.failure.message).toBe(
				'Failed to encode replicant "round": Too small: expected number to be >=1',
			);
		});

		test("encodes a JSON value with unknown schema", () => {
			const codec = makeCodec("anything", z.unknown());

			expect(codec.encode({ left: 1, tags: ["a"] })).toStrictEqual(
				Result.succeed({ left: 1, tags: ["a"] }),
			);
		});

		test("fails to encode non-JSON values with unknown schema", () => {
			const codec = makeCodec("anything", z.unknown());

			const encoded = codec.encode({ left: 1n });

			assert(Result.isFailure(encoded));
			expect(encoded.failure.message).toBe(
				'Failed to encode replicant "anything": Expected JSON value',
			);
		});

		test("fails to decode a value the schema refuses", () => {
			const codec = makeCodec("score", z.object({ left: z.number() }));

			const decoded = codec.decode({ left: "x" });

			assert(Result.isFailure(decoded));
			expect(decoded.failure.message).toBe(
				'Failed to decode replicant "score": left: Invalid input: expected number, received string',
			);
		});

		test("fails to decode with an asynchronous schema", () => {
			const schema = z.string().refine(async (text) => text.length > 0);
			const codec = makeCodec("label", schema);

			const decoded = codec.decode("a");

			assert(Result.isFailure(decoded));
			expect(decoded.failure.message).toBe(
				'Failed to decode replicant "label": The schema validated asynchronously',
			);
		});

		test("fails to encode with an asynchronous schema", () => {
			const schema = z.string().refine(async (text) => text.length > 0);
			const codec = makeCodec("label", schema);

			const encoded = codec.encode("a");

			assert(Result.isFailure(encoded));
			expect(encoded.failure.message).toBe(
				'Failed to encode replicant "label": The schema validated asynchronously',
			);
		});

		test("fails when the schema throws", () => {
			const schema: StandardSchemaV1<unknown, string> = {
				"~standard": {
					version: 1,
					vendor: "test",
					validate: () => {
						throw new Error("boom");
					},
				},
			};
			const codec = makeCodec("label", schema);

			const encoded = codec.encode("a");
			const decoded = codec.decode("a");

			assert(Result.isFailure(encoded));
			expect(encoded.failure.message).toBe(
				'Failed to encode replicant "label": The schema threw instead of returning issues',
			);
			assert(Result.isFailure(decoded));
			expect(decoded.failure.message).toBe(
				'Failed to decode replicant "label": The schema threw instead of returning issues',
			);
		});

		test("mutableDecode shares nothing with the input", () => {
			const codec = makeCodec("score", z.object({ data: z.unknown() }));
			const input = { data: { tags: ["a"] } };

			const score = codec.mutableDecode(input);

			assert(Result.isSuccess(score));
			expect(score.success).toStrictEqual(input);
			expect(score.success.data).not.toBe(input.data);
		});
	});
});
