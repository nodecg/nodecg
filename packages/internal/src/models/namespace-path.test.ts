import { Option, Schema } from "effect";
import { describe, expect, test } from "vitest";

import { NamespacePathFromString } from "./namespace-path.ts";

const decode = Schema.decodeOption(NamespacePathFromString);
const encode = Schema.encodeOption(NamespacePathFromString);

describe("NamespacePathFromString", () => {
	test("decodes each dotted segment into the path", () => {
		expect(decode("root.show.foo")).toEqual(
			Option.some(["root", "show", "foo"]),
		);
	});

	test("encodes the path joined with dots", () => {
		expect(encode(["root", "show", "foo"])).toEqual(
			Option.some("root.show.foo"),
		);
	});

	test("refuses an empty or unsafe segment", () => {
		expect(decode("")).toEqual(Option.none());
		expect(decode("root..show")).toEqual(Option.none());
		expect(decode("root.")).toEqual(Option.none());
		expect(decode("root.a/b")).toEqual(Option.none());
	});
});
