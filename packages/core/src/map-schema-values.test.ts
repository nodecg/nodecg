import { Schema, type HKT } from "effect";
import { describe, expect, expectTypeOf, test } from "vitest";

import { mapSchemaValues } from "./map-schema-values.ts";

interface ArrayLambda extends HKT.TypeLambda {
	readonly type: ReadonlyArray<this["Target"]>;
}

type Option = { readonly schema?: Schema.Codec<any> };

describe("mapSchemaValues", () => {
	test("maps only the entries carrying a schema", () => {
		const result = mapSchemaValues<Option, ArrayLambda>()(
			{ a: { schema: Schema.Finite }, b: { schema: Schema.String }, skip: {} },
			(value) => [value.schema],
		);
		expectTypeOf(result).toEqualTypeOf<{
			readonly a: ReadonlyArray<typeof Schema.Finite>;
			readonly b: ReadonlyArray<typeof Schema.String>;
		}>();
		expect(result).toEqual({ a: [Schema.Finite], b: [Schema.String] });
	});

	test("passes the key to the transform", () => {
		const keys: string[] = [];
		mapSchemaValues<Option, ArrayLambda>()(
			{ a: { schema: Schema.Finite }, b: { schema: Schema.Finite }, skip: {} },
			(value, key) => {
				keys.push(key);
				return [value.schema];
			},
		);
		expect(keys.sort()).toEqual(["a", "b"]);
	});

	test("returns an empty object when no entry carries a schema", () => {
		const result = mapSchemaValues<Option, ArrayLambda>()(
			{ a: {}, b: {} },
			(value) => [value.schema],
		);
		expectTypeOf(result).toEqualTypeOf<{}>();
		expect(result).toEqual({});
	});

	test("skips an entry whose schema is explicitly undefined", () => {
		const result = mapSchemaValues<Option, ArrayLambda>()(
			{ a: { schema: Schema.Finite }, b: { schema: undefined } },
			(value) => [value.schema],
		);
		expectTypeOf(result).toEqualTypeOf<{
			readonly a: ReadonlyArray<typeof Schema.Finite>;
		}>();
		expect(result).toEqual({ a: [Schema.Finite] });
	});

	test("returns an empty object for an undefined input", () => {
		const input: Record<string, Option> | undefined = undefined;
		const result = mapSchemaValues<Option, ArrayLambda>()(input, (value) => [
			value.schema,
		]);
		expect(result).toEqual({});
	});

	test("rejects a value that is not option-shaped", () => {
		mapSchemaValues<Option, ArrayLambda>()(
			// @ts-expect-error 123 is not `{ schema?: Schema }`
			{ bogus: 123 },
			(value) => [value.schema],
		);
	});
});
