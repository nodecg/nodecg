import { it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import { describe, expect, expectTypeOf, test } from "vitest";

import { jsonSchema } from "./json-schema.ts";

const score = jsonSchema({
	type: "object",
	properties: {
		left: { type: "number" },
		side: { enum: ["home", "away"] },
		tags: { type: "array", items: { type: "string" } },
		note: { type: ["string", "null"] },
	},
	required: ["left"],
	additionalProperties: false,
});

describe("jsonSchema", () => {
	test("infers the value type from the schema", () => {
		type Score = typeof score.Type;

		expectTypeOf<Score["left"]>().toEqualTypeOf<number>();
		expectTypeOf<Score["side"]>().toEqualTypeOf<"home" | "away" | undefined>();
		expectTypeOf<Score["tags"]>().toEqualTypeOf<string[] | undefined>();
		expectTypeOf<Score["note"]>().toEqualTypeOf<string | null | undefined>();
	});

	it.effect("accepts a value the schema allows", () =>
		Effect.gen(function* () {
			const value = yield* Schema.decodeEffect(score)({
				left: 1,
				side: "home",
			});

			expect(value).toEqual({ left: 1, side: "home" });
		}),
	);

	it.effect("reports where a value breaks the schema", () =>
		Effect.gen(function* () {
			const error = yield* Effect.flip(
				Schema.decodeUnknownEffect(score)({ left: "x" }),
			);

			expect(error.message).toMatchInlineSnapshot(`
				"Expected number
				  at ["left"]"
			`);
		}),
	);

	test("applies a regex pattern", () => {
		const isCode = Schema.is(
			jsonSchema({ type: "string", pattern: "^[A-Z]+$" }),
		);

		expect(isCode("ABC")).toBe(true);
		expect(isCode("abc")).toBe(false);
	});

	it.effect("drops a property the schema does not list", () =>
		Effect.gen(function* () {
			const value = yield* Schema.decodeUnknownEffect(score)({
				left: 1,
				right: 2,
			});

			expect(value).toStrictEqual({ left: 1 });
		}),
	);

	test("refuses logical keywords", () => {
		expect(() =>
			// @ts-expect-error not is unsupported
			jsonSchema({ not: { type: "string" } }),
		).toThrow('Cannot import JSON Schema keyword "not"');
		expect(() =>
			// @ts-expect-error if is unsupported
			jsonSchema({ if: { type: "string" }, else: { minimum: 1 } }),
		).toThrow('Cannot import JSON Schema keyword "if"');
		expect(() =>
			// @ts-expect-error contains is unsupported
			jsonSchema({ type: "array", contains: { type: "string" } }),
		).toThrow('Cannot import JSON Schema keyword "contains"');
	});

	test("refuses a logical keyword inside a subschema", () => {
		expect(() =>
			jsonSchema({
				type: "object",
				// @ts-expect-error not is unsupported
				properties: { name: { not: { type: "string" } } },
			}),
		).toThrow('Cannot import JSON Schema keyword "not"');
		expect(() =>
			jsonSchema({
				type: "array",
				// @ts-expect-error contains is unsupported
				items: { type: "array", contains: { type: "string" } },
			}),
		).toThrow('Cannot import JSON Schema keyword "contains"');
		expect(() =>
			jsonSchema({
				anyOf: [
					{ type: "string" },
					// @ts-expect-error if is unsupported
					{ if: { type: "number" }, else: { minimum: 1 } },
				],
			}),
		).toThrow('Cannot import JSON Schema keyword "if"');
	});

	test("accepts a property named like a logical keyword", () => {
		const flags = jsonSchema({
			type: "object",
			properties: { not: { type: "boolean" }, if: { type: "string" } },
			required: ["not"],
		});
		type Flags = typeof flags.Type;

		expectTypeOf<Flags["not"]>().toEqualTypeOf<boolean>();
		expectTypeOf<Flags["if"]>().toEqualTypeOf<string | undefined>();
		expect(Schema.is(flags)({ not: true, if: "x" })).toBe(true);
	});

	test("refuses a misspelled type", () => {
		// @ts-expect-error "objcet" is not a JSON Schema type
		jsonSchema({ type: "objcet" });
	});
});
