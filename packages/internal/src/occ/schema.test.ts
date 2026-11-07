import { Schema } from "effect";
import { describe, expect, test } from "vitest";

import { ChangeOp, Patch, PatchOp, Pointer } from "./schema.ts";

const decodeOp = Schema.decodeUnknownSync(ChangeOp);
const decodePatchOp = Schema.decodeUnknownSync(PatchOp);
const decodePatch = Schema.decodeUnknownSync(Patch);
const decodePointer = Schema.decodeUnknownSync(Pointer);

describe("Pointer", () => {
	test("accepts the root pointer and /-prefixed pointers", () => {
		expect(decodePointer("")).toBe("");
		expect(decodePointer("/a/0/b")).toBe("/a/0/b");
	});

	test("rejects a pointer missing the leading slash", () => {
		expect(() => decodePointer("a/b")).toThrow();
	});
});

describe("ChangeOp", () => {
	test("decodes every op shape", () => {
		expect(decodeOp({ op: "add", path: "/a", value: null })).toEqual({
			op: "add",
			path: "/a",
			value: null,
		});
		expect(decodeOp({ op: "remove", path: "/a/0" })).toEqual({
			op: "remove",
			path: "/a/0",
		});
		expect(decodeOp({ op: "replace", path: "", value: [1] })).toEqual({
			op: "replace",
			path: "",
			value: [1],
		});
		expect(decodeOp({ op: "move", from: "/a/1", path: "/a/0" })).toEqual({
			op: "move",
			from: "/a/1",
			path: "/a/0",
		});
	});

	test("rejects ops outside the wire vocabulary", () => {
		expect(() => decodeOp({ op: "copy", from: "/a", path: "/b" })).toThrow();
		expect(() =>
			decodePatchOp({ op: "copy", from: "/a", path: "/b" }),
		).toThrow();
	});
});

describe("PatchOp", () => {
	test("decodes a test-hash precondition", () => {
		expect(
			decodePatchOp({ op: "test-hash", path: "/a", hash: "ab12" }),
		).toEqual({ op: "test-hash", path: "/a", hash: "ab12" });
	});

	test("decodes a test precondition", () => {
		expect(decodePatchOp({ op: "test", path: "/a", value: { b: 1 } })).toEqual({
			op: "test",
			path: "/a",
			value: { b: 1 },
		});
	});

	test("a precondition is not a change op", () => {
		expect(() =>
			decodeOp({ op: "test-hash", path: "/a", hash: "ab12" }),
		).toThrow();
		expect(() => decodeOp({ op: "test", path: "/a", value: 1 })).toThrow();
	});
});

describe("Patch", () => {
	test("decodes a mixed multi-op patch and rejects an empty one", () => {
		expect(
			decodePatch([
				{ op: "test-hash", path: "/a", hash: "ab12" },
				{ op: "replace", path: "/a", value: 2 },
				{ op: "add", path: "/b", value: 3 },
				{ op: "remove", path: "/c" },
			]),
		).toHaveLength(4);
		expect(() => decodePatch([])).toThrow();
	});
});
