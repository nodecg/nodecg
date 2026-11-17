import { Option } from "effect";
import { describe, expect, expectTypeOf, test } from "vitest";

import {
	type CaseClashingKeys,
	findCaseClash,
	isFileSafeName,
	type UnsafeNameKeys,
	type ValidateFileSafeName,
} from "./file-safe-name.ts";

type Rule =
	'Use only A-Z, a-z, 0-9, "_" and "-", and not a Windows device name';

describe("isFileSafeName", () => {
	test("accepts A-Z, a-z, 0-9, underscores and dashes", () => {
		expect(isFileSafeName("Show-2_a")).toBe(true);
	});

	test("accepts a name that only starts like a Windows device name", () => {
		expect(isFileSafeName("console")).toBe(true);
	});

	test.each(["", "a b", "a.b", "a/b", "a\\b", "..", "é"])(
		"rejects %j",
		(name) => {
			expect(isFileSafeName(name)).toBe(false);
		},
	);

	test("rejects a Windows device name in any case", () => {
		expect(isFileSafeName("Com1")).toBe(false);
	});
});

describe("findCaseClash", () => {
	test("finds nothing when every name differs by more than case", () => {
		expect(findCaseClash(["home", "away"])).toEqual(Option.none());
	});

	test("finds a name that differs from an earlier one only in case", () => {
		expect(findCaseClash(["home", "away", "Home"])).toEqual(
			Option.some({ name: "Home", clash: "home" }),
		);
	});
});

describe("ValidateFileSafeName", () => {
	test("keeps a safe literal", () => {
		expectTypeOf<
			ValidateFileSafeName<"Show-2_a">
		>().toEqualTypeOf<"Show-2_a">();
	});

	test("turns an unsafe literal into the rule", () => {
		expectTypeOf<ValidateFileSafeName<"a.b">>().toEqualTypeOf<Rule>();
		expectTypeOf<ValidateFileSafeName<"Com1">>().toEqualTypeOf<Rule>();
		expectTypeOf<ValidateFileSafeName<"">>().toEqualTypeOf<Rule>();
	});

	test("turns a name that is not fully literal into the rule", () => {
		expectTypeOf<ValidateFileSafeName<string>>().toEqualTypeOf<Rule>();
		expectTypeOf<
			ValidateFileSafeName<`bundle-${string}`>
		>().toEqualTypeOf<Rule>();
	});
});

describe("UnsafeNameKeys", () => {
	test("picks only the unsafe keys", () => {
		expectTypeOf<
			keyof UnsafeNameKeys<{ score: 1; "a b": 2 }>
		>().toEqualTypeOf<"a b">();
	});
});

describe("CaseClashingKeys", () => {
	test("picks the keys that differ from another key only in case", () => {
		expectTypeOf<
			keyof CaseClashingKeys<{ home: 1; Home: 2; away: 3 }>
		>().toEqualTypeOf<"home" | "Home">();
	});
});
