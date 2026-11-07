import { Result, type Schema } from "effect";
import { assert, describe, expect, test } from "vitest";

import { ApplyFailure, applyPatch } from "./apply.ts";
import { computeTestHash } from "./hash.ts";
import type { Patch } from "./schema.ts";

const applied = (value: Schema.Json, patch: Patch) =>
	applyPatch(value, patch).pipe(Result.getOrThrow);

const failure = (value: Schema.Json, patch: Patch) =>
	applyPatch(value, patch).pipe(Result.flip, Result.getOrThrow);

describe("applyPatch", () => {
	describe("replace", () => {
		test("object key and array element", () => {
			expect(
				applied({ a: 1, arr: [1, 2] }, [
					{ op: "replace", path: "/a", value: 9 },
					{ op: "replace", path: "/arr/1", value: 5 },
				]),
			).toEqual({ a: 9, arr: [1, 5] });
		});

		test("whole document", () => {
			expect(
				applied({ a: 1 }, [{ op: "replace", path: "", value: [1] }]),
			).toEqual([1]);
		});

		test("missing object key fails (concurrent remove surfaces as conflict)", () => {
			expect(
				failure({ a: 1 }, [{ op: "replace", path: "/b", value: 1 }]).cause,
			).toEqual(ApplyFailure.MissingKey({ key: "b" }));
		});

		test("array index past the end fails", () => {
			expect(
				failure([1], [{ op: "replace", path: "/1", value: 2 }]).cause,
			).toEqual(ApplyFailure.IndexOutOfBounds({ index: 1 }));
		});

		test("non-canonical array index fails", () => {
			expect(
				failure([1], [{ op: "replace", path: "/01", value: 2 }]).cause,
			).toEqual(ApplyFailure.InvalidIndex({ token: "01" }));
		});

		test("a primitive is not a container", () => {
			expect(
				failure({ a: 1 }, [{ op: "replace", path: "/a/b", value: 2 }]).cause,
			).toEqual(ApplyFailure.NonContainer({ token: "b" }));
		});

		test("the failing op is reported", () => {
			expect(
				failure({ a: 1 }, [
					{ op: "replace", path: "/a", value: 9 },
					{ op: "replace", path: "/missing", value: 1 },
				]).op,
			).toEqual({ op: "replace", path: "/missing", value: 1 });
		});
	});

	describe("add", () => {
		test("new object key upserts", () => {
			expect(applied({ a: 1 }, [{ op: "add", path: "/b", value: 2 }])).toEqual({
				a: 1,
				b: 2,
			});
		});

		test("existing object key is overwritten", () => {
			expect(applied({ a: 1 }, [{ op: "add", path: "/a", value: 2 }])).toEqual({
				a: 2,
			});
		});

		test("array insert shifts elements right", () => {
			expect(applied([1, 3], [{ op: "add", path: "/1", value: 2 }])).toEqual([
				1, 2, 3,
			]);
		});

		test("append at length and via -", () => {
			expect(applied([1], [{ op: "add", path: "/1", value: 2 }])).toEqual([
				1, 2,
			]);
			expect(applied([1], [{ op: "add", path: "/-", value: 2 }])).toEqual([
				1, 2,
			]);
		});

		test("index past the end fails", () => {
			expect(failure([1], [{ op: "add", path: "/5", value: 2 }]).cause).toEqual(
				ApplyFailure.IndexOutOfBounds({ index: 5 }),
			);
		});

		test("non-canonical array index fails", () => {
			expect(
				failure([1], [{ op: "add", path: "/01", value: 2 }]).cause,
			).toEqual(ApplyFailure.InvalidIndex({ token: "01" }));
		});

		test("__proto__ is refused rather than written through the inherited setter", () => {
			expect(
				failure({ a: 1 }, [
					{ op: "add", path: "/__proto__", value: { evil: true } },
				]).cause,
			).toEqual(ApplyFailure.ForbiddenKey({ key: "__proto__" }));
		});

		test("a nested __proto__ is refused too", () => {
			expect(
				failure({ a: { b: 1 } }, [
					{ op: "add", path: "/a/__proto__", value: { evil: true } },
				]).cause,
			).toEqual(ApplyFailure.ForbiddenKey({ key: "__proto__" }));
		});

		test("a key every object inherits is refused", () => {
			expect(
				failure({ a: 1 }, [{ op: "add", path: "/constructor", value: 2 }])
					.cause,
			).toEqual(ApplyFailure.ForbiddenKey({ key: "constructor" }));
		});
	});

	describe("remove", () => {
		test("object key and array element", () => {
			expect(
				applied({ a: 1, arr: [1, 2, 3] }, [
					{ op: "remove", path: "/a" },
					{ op: "remove", path: "/arr/1" },
				]),
			).toEqual({ arr: [1, 3] });
		});

		test("missing object key fails", () => {
			expect(failure({ a: 1 }, [{ op: "remove", path: "/b" }]).cause).toEqual(
				ApplyFailure.MissingKey({ key: "b" }),
			);
		});

		test("array index past the end fails", () => {
			expect(failure([1], [{ op: "remove", path: "/1" }]).cause).toEqual(
				ApplyFailure.IndexOutOfBounds({ index: 1 }),
			);
		});

		test("the root is not removable", () => {
			expect(failure({ a: 1 }, [{ op: "remove", path: "" }]).cause).toEqual(
				ApplyFailure.ImmovableRoot(),
			);
		});
	});

	describe("move", () => {
		test("array reorder", () => {
			expect(
				applied(
					[1, 2, 3],
					[
						{ op: "move", from: "/2", path: "/0" },
						{ op: "move", from: "/2", path: "/1" },
					],
				),
			).toEqual([3, 2, 1]);
		});

		test("object key rename", () => {
			expect(
				applied({ a: 1 }, [{ op: "move", from: "/a", path: "/b" }]),
			).toEqual({ b: 1 });
		});

		test("moves a value between containers", () => {
			expect(
				applied({ from: [{ deep: 1 }], to: [] }, [
					{ op: "move", from: "/from/0", path: "/to/-" },
				]),
			).toEqual({ from: [], to: [{ deep: 1 }] });
		});

		test("move onto itself is a no-op", () => {
			expect(applied([1, 2], [{ op: "move", from: "/1", path: "/1" }])).toEqual(
				[1, 2],
			);
		});

		test("missing source fails", () => {
			expect(
				failure({ a: 1 }, [{ op: "move", from: "/b", path: "/c" }]).cause,
			).toEqual(ApplyFailure.MissingKey({ key: "b" }));
		});

		test("the root is not movable", () => {
			expect(
				failure({ a: 1 }, [{ op: "move", from: "", path: "/a" }]).cause,
			).toEqual(ApplyFailure.ImmovableRoot());
		});

		test("moving into its own child fails", () => {
			expect(
				failure({ a: { b: 1 } }, [{ op: "move", from: "/a", path: "/a/b" }])
					.cause,
			).toEqual(ApplyFailure.MoveIntoSelf({ from: "/a", path: "/a/b" }));
		});

		test("a move onto __proto__ is refused", () => {
			expect(
				failure({ a: 1, b: 2 }, [
					{ op: "move", from: "/a", path: "/__proto__" },
				]).cause,
			).toEqual(ApplyFailure.ForbiddenKey({ key: "__proto__" }));
		});
	});

	describe("test-hash", () => {
		test("a matching hash passes and leaves the document unchanged", () => {
			expect(
				applied({ a: 1, b: 2 }, [
					{ op: "test-hash", path: "/a", hash: computeTestHash(1) },
				]),
			).toEqual({ a: 1, b: 2 });
		});

		test("a stale hash fails with both hashes", () => {
			expect(
				failure({ a: 2 }, [
					{ op: "test-hash", path: "/a", hash: computeTestHash(1) },
				]).cause,
			).toEqual(
				ApplyFailure.HashMismatch({
					expected: computeTestHash(1),
					actual: computeTestHash(2),
				}),
			);
		});

		test("a vanished target fails on navigation, not on the hash", () => {
			expect(
				failure({ a: 1 }, [
					{ op: "test-hash", path: "/gone", hash: computeTestHash(1) },
				]).cause,
			).toEqual(ApplyFailure.MissingKey({ key: "gone" }));
		});

		test("a stale precondition blocks the op it guards", () => {
			const input = { a: 1 };
			expect(
				failure(input, [
					{ op: "test-hash", path: "/a", hash: computeTestHash(99) },
					{ op: "replace", path: "/a", value: 5 },
				]).op,
			).toEqual({ op: "test-hash", path: "/a", hash: computeTestHash(99) });
			expect(input).toEqual({ a: 1 });
		});

		test("a precondition on one path does not guard a sibling", () => {
			expect(
				applied({ a: 1, b: 2 }, [
					{ op: "test-hash", path: "/a", hash: computeTestHash(1) },
					{ op: "replace", path: "/b", value: 9 },
				]),
			).toEqual({ a: 1, b: 9 });
		});
	});

	describe("test", () => {
		test("a matching value passes and leaves the document unchanged", () => {
			expect(
				applied({ a: 1, b: 2 }, [{ op: "test", path: "/a", value: 1 }]),
			).toEqual({ a: 1, b: 2 });
		});

		test("a stale value fails", () => {
			expect(
				failure({ a: 2 }, [{ op: "test", path: "/a", value: 1 }]).cause,
			).toEqual(ApplyFailure.ValueMismatch());
		});

		test("a vanished target fails on navigation, not on the value", () => {
			expect(
				failure({ a: 1 }, [{ op: "test", path: "/gone", value: 1 }]).cause,
			).toEqual(ApplyFailure.MissingKey({ key: "gone" }));
		});

		test("key order does not matter", () => {
			expect(
				applied({ pair: { x: 1, y: 2 } }, [
					{ op: "test", path: "/pair", value: { y: 2, x: 1 } },
					{ op: "replace", path: "/pair", value: { x: 3, y: 4 } },
				]),
			).toEqual({ pair: { x: 3, y: 4 } });
		});

		test("a precondition on one path does not guard a sibling", () => {
			expect(
				applied({ a: 1, b: 2 }, [
					{ op: "test", path: "/a", value: 1 },
					{ op: "replace", path: "/b", value: 9 },
				]),
			).toEqual({ a: 1, b: 9 });
		});
	});

	describe("pointer escaping", () => {
		test("~1 and ~0 address keys containing / and ~", () => {
			expect(
				applied({ "a/b": 1, "x~y": 2 }, [
					{ op: "replace", path: "/a~1b", value: 3 },
					{ op: "remove", path: "/x~0y" },
				]),
			).toEqual({ "a/b": 3 });
		});
	});

	describe("isolation", () => {
		test("the input is never mutated, even by a successful apply", () => {
			const input = { a: { b: 1 } };
			const result = applyPatch(input, [
				{ op: "replace", path: "/a/b", value: 2 },
			]);
			assert(Result.isSuccess(result));
			expect(input).toEqual({ a: { b: 1 } });
		});

		test("a mid-patch failure leaves no partial result observable", () => {
			const input = { a: 1, b: 1 };
			const result = applyPatch(input, [
				{ op: "replace", path: "/a", value: 9 },
				{ op: "replace", path: "/missing", value: 1 },
			]);
			assert(Result.isFailure(result));
			expect(input).toEqual({ a: 1, b: 1 });
		});

		test("written values do not alias the patch", () => {
			const value = { nested: 1 };
			const result = applyPatch({ v: 0 }, [
				{ op: "replace", path: "/v", value },
			]);
			assert(Result.isSuccess(result));
			value.nested = 2;
			expect(result.success).toEqual({ v: { nested: 1 } });
		});

		test("prototype members are not addressable", () => {
			expect(
				failure({}, [{ op: "replace", path: "/constructor", value: 1 }]).cause,
			).toEqual(ApplyFailure.MissingKey({ key: "constructor" }));
		});
	});
});
