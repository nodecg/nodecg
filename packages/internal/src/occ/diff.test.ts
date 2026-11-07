import { Result, type Schema } from "effect";
import { assert, describe, expect, test } from "vitest";

import { applyPatch } from "./apply.ts";
import { diffPatch, diffSignedPatch } from "./diff.ts";
import { computeTestHash } from "./hash.ts";

const ops = (base: Schema.Json, next: Schema.Json) =>
	diffPatch(base, next).pipe(Result.getOrThrow);

const signedOps = (base: Schema.Json, next: Schema.Json) =>
	diffSignedPatch(base, next).pipe(Result.getOrThrow);

const roundTrip = (base: Schema.Json, next: Schema.Json) => {
	const result = applyPatch(base, ops(base, next));
	assert(Result.isSuccess(result));
	expect(result.success).toEqual(next);
};

describe("diffPatch", () => {
	test("no change yields an empty patch", () => {
		expect(ops({ a: 1 }, { a: 1 })).toEqual([]);
	});

	test("an object edit ships only the changed field", () => {
		expect(ops({ a: 1, b: "x" }, { a: 2, b: "x" })).toEqual([
			{ op: "replace", path: "/a", value: 2 },
		]);
	});

	test("disjoint object edits ship one op each", () => {
		expect(ops({ a: 1, b: 2 }, { a: 9, b: 8 })).toEqual([
			{ op: "replace", path: "/a", value: 9 },
			{ op: "replace", path: "/b", value: 8 },
		]);
	});

	test("a nested edit addresses the nested path", () => {
		expect(ops({ a: { b: { c: 1 } } }, { a: { b: { c: 2 } } })).toEqual([
			{ op: "replace", path: "/a/b/c", value: 2 },
		]);
	});

	test("a long string change is a plain replace, not a text delta", () => {
		const long = "a".repeat(120);
		expect(ops({ t: long }, { t: `${long}b` })).toEqual([
			{ op: "replace", path: "/t", value: `${long}b` },
		]);
	});

	test("round-trips a field edit", () => {
		roundTrip({ a: { b: 1 }, c: "x" }, { a: { b: 2 }, c: "x" });
	});

	describe("structural change", () => {
		test("a new key ships as an add", () => {
			expect(ops({ a: 1 }, { a: 1, b: 2 })).toEqual([
				{ op: "add", path: "/b", value: 2 },
			]);
			roundTrip({ a: 1 }, { a: 1, b: 2 });
		});

		test("sibling adds ship one op each", () => {
			expect(ops({ a: 1 }, { a: 1, b: 2, c: 3 })).toEqual([
				{ op: "add", path: "/b", value: 2 },
				{ op: "add", path: "/c", value: 3 },
			]);
		});

		test("a removed key ships as a remove", () => {
			expect(ops({ a: 1, b: 2 }, { a: 1 })).toEqual([
				{ op: "remove", path: "/b" },
			]);
			roundTrip({ a: 1, b: 2 }, { a: 1 });
		});

		test("an array append ships as an add at the end", () => {
			expect(ops([1, 2], [1, 2, 3])).toEqual([
				{ op: "add", path: "/2", value: 3 },
			]);
			roundTrip([1, 2], [1, 2, 3]);
		});

		test("an array removal ships as one remove, not a positional cascade", () => {
			expect(ops([1, 2, 3], [1, 3])).toEqual([{ op: "remove", path: "/1" }]);
			roundTrip([1, 2, 3], [1, 3]);
		});

		test("a nested append addresses the nested array", () => {
			expect(ops({ p: { list: ["x"] } }, { p: { list: ["x", "y"] } })).toEqual([
				{ op: "add", path: "/p/list/1", value: "y" },
			]);
		});

		test("an edited array element ships whole, as the content hash matches by content", () => {
			const base = [
				{ id: "a", v: 1 },
				{ id: "b", v: 2 },
			];
			const next = [
				{ id: "a", v: 1 },
				{ id: "b", v: 9 },
			];
			expect(ops(base, next)).toEqual([
				{ op: "remove", path: "/1" },
				{ op: "add", path: "/1", value: { id: "b", v: 9 } },
			]);
			roundTrip(base, next);
		});

		test("a change of the document's own type is a root replace", () => {
			expect(ops({ a: 1 }, [1])).toEqual([
				{ op: "replace", path: "", value: [1] },
			]);
			roundTrip(5, { a: 1 });
		});
	});

	describe("reorder", () => {
		test("a single relocation ships as one move", () => {
			expect(ops(["a", "b", "c"], ["c", "a", "b"])).toEqual([
				{ op: "move", from: "/2", path: "/0" },
			]);
			roundTrip(["a", "b", "c"], ["c", "a", "b"]);
		});

		test("a reversal ships as moves, not a document replace", () => {
			const base = [{ id: "a" }, { id: "b" }, { id: "c" }];
			const next = [{ id: "c" }, { id: "b" }, { id: "a" }];
			expect(ops(base, next)).toEqual([
				{ op: "move", from: "/2", path: "/0" },
				{ op: "move", from: "/2", path: "/1" },
			]);
			roundTrip(base, next);
		});

		test("an element edited while the array reorders ships whole beside the moves", () => {
			const base = [
				{ id: "a", score: 1 },
				{ id: "b", score: 2 },
				{ id: "c", score: 3 },
			];
			const next = [
				{ id: "c", score: 99 },
				{ id: "b", score: 2 },
				{ id: "a", score: 1 },
			];
			expect(ops(base, next)).toEqual([
				{ op: "remove", path: "/2" },
				{ op: "move", from: "/1", path: "/0" },
				{ op: "add", path: "/0", value: { id: "c", score: 99 } },
			]);
			roundTrip(base, next);
		});
	});
});

describe("diffSignedPatch", () => {
	test("an edit is preceded by the hash of what it expects to find", () => {
		expect(signedOps({ a: 1, b: "x" }, { a: 2, b: "x" })).toEqual([
			{ op: "test-hash", path: "/a", hash: computeTestHash(1) },
			{ op: "replace", path: "/a", value: 2 },
		]);
	});

	test("a removal signs the value it removes", () => {
		expect(signedOps({ a: 1, b: 2 }, { a: 1 })).toEqual([
			{ op: "test-hash", path: "/b", hash: computeTestHash(2) },
			{ op: "remove", path: "/b" },
		]);
	});

	test("a new key carries no precondition, so sibling adds cannot conflict", () => {
		expect(signedOps({ a: 1 }, { a: 1, b: 2, c: 3 })).toEqual([
			{ op: "add", path: "/b", value: 2 },
			{ op: "add", path: "/c", value: 3 },
		]);
	});

	test("an append ships as the end-of-array token, unsigned", () => {
		expect(signedOps([1, 2], [1, 2, 3])).toEqual([
			{ op: "add", path: "/-", value: 3 },
		]);
	});

	test("an insert keeps its index and signs the element it displaces", () => {
		expect(signedOps([1, 3], [1, 2, 3])).toEqual([
			{ op: "test-hash", path: "/1", hash: computeTestHash(3) },
			{ op: "add", path: "/1", value: 2 },
		]);
	});

	test("a move signs where it takes from, not where it puts", () => {
		expect(signedOps(["a", "b", "c"], ["c", "a", "b"])).toEqual([
			{ op: "test-hash", path: "/2", hash: computeTestHash("c") },
			{ op: "move", from: "/2", path: "/0" },
		]);
	});

	test("each precondition is taken after the ops before it applied", () => {
		const base = [{ id: "a" }, { id: "b" }, { id: "c" }];
		expect(signedOps(base, [{ id: "c" }, { id: "b" }, { id: "a" }])).toEqual([
			{ op: "test-hash", path: "/2", hash: computeTestHash({ id: "c" }) },
			{ op: "move", from: "/2", path: "/0" },
			{ op: "test-hash", path: "/2", hash: computeTestHash({ id: "b" }) },
			{ op: "move", from: "/2", path: "/1" },
		]);
	});

	test("the signed patch applies to the base it was taken from", () => {
		const base = { a: { b: 1 }, list: [1, 2] };
		const next = { a: { b: 2 }, list: [1, 2, 3] };
		const result = applyPatch(base, signedOps(base, next));
		assert(Result.isSuccess(result));
		expect(result.success).toEqual(next);
	});

	test("the signed patch is refused by a document that moved on", () => {
		const patch = signedOps({ a: 1 }, { a: 2 });
		const result = applyPatch({ a: 5 }, patch);
		assert(Result.isFailure(result));
		expect(result.failure.cause._tag).toBe("HashMismatch");
	});

	test("a write to another field still applies to a document that moved on", () => {
		const patch = signedOps({ a: 1, b: 1 }, { a: 2, b: 1 });
		const result = applyPatch({ a: 1, b: 9 }, patch);
		assert(Result.isSuccess(result));
		expect(result.success).toEqual({ a: 2, b: 9 });
	});
});
