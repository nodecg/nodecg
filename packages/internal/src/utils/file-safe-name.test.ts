import { Option } from "effect";
import { describe, expect, expectTypeOf, test } from "vitest";

import {
	type CaseClashingKeys,
	type FileSafeName,
	findCaseClash,
	isFileSafeName,
	type UnsafeNameKeys,
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
		expect(findCaseClash(["home", "away"], ["score"])).toEqual(Option.none());
	});

	test("finds a name that differs from an earlier one only in case", () => {
		expect(findCaseClash(["home", "away", "Home"], [])).toEqual(
			Option.some({ name: "Home", clash: "home" }),
		);
	});

	test("finds a name that differs from an existing one only in case", () => {
		expect(findCaseClash(["Score"], ["score"])).toEqual(
			Option.some({ name: "Score", clash: "score" }),
		);
	});

	test("allows a name that repeats an existing one exactly", () => {
		expect(findCaseClash(["score"], ["score"])).toEqual(Option.none());
	});
});

describe("FileSafeName", () => {
	test("keeps a safe literal", () => {
		expectTypeOf<FileSafeName<"Show-2_a">>().toEqualTypeOf<"Show-2_a">();
	});

	test("turns an unsafe literal into the rule", () => {
		expectTypeOf<FileSafeName<"a.b">>().toEqualTypeOf<Rule>();
		expectTypeOf<FileSafeName<"Com1">>().toEqualTypeOf<Rule>();
		expectTypeOf<FileSafeName<"">>().toEqualTypeOf<Rule>();
	});

	test("turns a name that is not fully literal into the rule", () => {
		expectTypeOf<FileSafeName<string>>().toEqualTypeOf<Rule>();
		expectTypeOf<FileSafeName<`bundle-${string}`>>().toEqualTypeOf<Rule>();
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

	test("picks a key that differs from an existing name only in case", () => {
		expectTypeOf<
			keyof CaseClashingKeys<{ Score: 1 }, "score">
		>().toEqualTypeOf<"Score">();
	});

	test("allows a key that repeats an existing name exactly", () => {
		expectTypeOf<
			keyof CaseClashingKeys<{ score: 1 }, "score">
		>().toEqualTypeOf<never>();
	});
});
