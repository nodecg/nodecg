import { Option, Schema } from "effect";
import { describe, expect, test } from "vitest";

import { findInheritedKey, isInheritedKey } from "./inherited-key.ts";

const decodeJsonText = Schema.decodeSync(Schema.fromJsonString(Schema.Json));

describe("isInheritedKey", () => {
	test.each(["toString", "constructor", "hasOwnProperty", "__proto__"])(
		"holds for %j",
		(key) => {
			expect(isInheritedKey(key)).toBe(true);
		},
	);

	test.each(["a", "", "length", "prototype", "0"])("fails for %j", (key) => {
		expect(isInheritedKey(key)).toBe(false);
	});
});

describe("findInheritedKey", () => {
	test("finds nothing in a value with ordinary keys", () => {
		expect(
			findInheritedKey({ a: [1, "toString", { length: 2 }], b: null }),
		).toEqual(Option.none());
	});

	test("finds nothing in a value that is not an object", () => {
		expect(findInheritedKey("constructor")).toEqual(Option.none());
	});

	test("finds a key of the top-level object", () => {
		expect(findInheritedKey({ a: 1, toString: 2 })).toEqual(
			Option.some("toString"),
		);
	});

	test("finds a key of an object nested in arrays and objects", () => {
		expect(findInheritedKey({ a: [1, { b: { constructor: 2 } }] })).toEqual(
			Option.some("constructor"),
		);
	});

	test("finds a __proto__ key that came from parsed JSON", () => {
		expect(findInheritedKey(decodeJsonText('{"a":{"__proto__":1}}'))).toEqual(
			Option.some("__proto__"),
		);
	});
});
