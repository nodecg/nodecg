// Apply patch produced from diff.ts

import { Data, Match, Option, Result, type Schema } from "effect";

import { cloneJson } from "../utils/clone.ts";
import { isInheritedKey } from "../utils/inherited-key.ts";
import { stableStringify, computeTestHash } from "./hash.ts";
import type { ChangeOp, PatchOp, Pointer } from "./schema.ts";

const unescapeToken = (token: string) =>
	token.replaceAll("~1", "/").replaceAll("~0", "~");

const parsePointer = (pointer: Pointer) => {
	const tokens = pointer.split("/");
	// Drop the empty string before the leading slash
	tokens.shift();
	return tokens.map(unescapeToken);
};

const parseIndex = (token: string) => {
	const index = Number.parseInt(token);
	if (Number.isSafeInteger(index) && index >= 0 && index.toString() === token) {
		return Option.some(index);
	}
	return Option.none();
};

// Why an op did not apply. Every cause rejects the same way, the tag carries the diagnostics.
export type ApplyFailure = Data.TaggedEnum<{
	NonContainer: { readonly token: string };
	InvalidIndex: { readonly token: string };
	IndexOutOfBounds: { readonly index: number };
	MissingKey: { readonly key: string };
	ForbiddenKey: { readonly key: string };
	ImmovableRoot: {};
	MoveIntoSelf: { readonly from: Pointer; readonly path: Pointer };
	HashMismatch: { readonly expected: string; readonly actual: string };
	ValueMismatch: {};
}>;
export const ApplyFailure = Data.taggedEnum<ApplyFailure>();

export const isDrift = ApplyFailure.$match({
	HashMismatch: () => true,
	ValueMismatch: () => true,
	IndexOutOfBounds: () => true,
	MissingKey: () => true,
	NonContainer: () => true,
	InvalidIndex: () => false,
	ForbiddenKey: () => false,
	ImmovableRoot: () => false,
	MoveIntoSelf: () => false,
});

const getChild = (
	parent: Schema.MutableJson,
	token: string,
): Result.Result<Schema.MutableJson, ApplyFailure> => {
	// Primitive
	if (parent === null || typeof parent !== "object") {
		return Result.fail(ApplyFailure.NonContainer({ token }));
	}

	if (Array.isArray(parent)) {
		const idx = parseIndex(token);
		if (Option.isNone(idx)) {
			return Result.fail(ApplyFailure.InvalidIndex({ token }));
		}
		const element = parent[idx.value];
		if (typeof element === "undefined") {
			return Result.fail(ApplyFailure.IndexOutOfBounds({ index: idx.value }));
		}
		return Result.succeed(element);
	}

	// hasOwn to avoid "constructor" and other prototype properties
	if (!Object.hasOwn(parent, token)) {
		return Result.fail(ApplyFailure.MissingKey({ key: token }));
	}
	const value = parent[token];
	if (typeof value === "undefined") {
		return Result.fail(ApplyFailure.MissingKey({ key: token }));
	}
	return Result.succeed(value);
};

const navigate = (root: Schema.MutableJson, tokens: ReadonlyArray<string>) =>
	tokens.reduce<Result.Result<Schema.MutableJson, ApplyFailure>>(
		(cur, token) =>
			cur.pipe(Result.flatMap((currentValue) => getChild(currentValue, token))),
		Result.succeed(root),
	);

export const getAtPointer = (root: Schema.MutableJson, pointer: Pointer) =>
	navigate(root, parsePointer(pointer));

/**
 * RFC 6902 add: returns the new document
 * - array: insert at the index, "-" appends at the end
 * - object: upsert on the key
 * - "" replaces the whole document
 */
const add = (
	root: Schema.MutableJson,
	pointer: Pointer,
	value: Schema.MutableJson,
): Result.Result<Schema.MutableJson, ApplyFailure> => {
	const tokens = parsePointer(pointer);
	const targetToken = tokens.pop();

	// Replace the whole document for empty pointer
	if (typeof targetToken === "undefined") {
		return Result.succeed(value);
	}

	const parentNavigateResult = navigate(root, tokens);
	if (Result.isFailure(parentNavigateResult)) {
		return parentNavigateResult;
	}
	const parent = parentNavigateResult.success;
	if (Array.isArray(parent)) {
		if (targetToken === "-") {
			parent.push(value);
			return Result.succeed(root);
		}
		const idx = parseIndex(targetToken);
		if (Option.isNone(idx)) {
			return Result.fail(ApplyFailure.InvalidIndex({ token: targetToken }));
		}
		if (idx.value > parent.length) {
			return Result.fail(ApplyFailure.IndexOutOfBounds({ index: idx.value }));
		}
		parent.splice(idx.value, 0, value);
		return Result.succeed(root);
	}
	if (parent !== null && typeof parent === "object") {
		if (isInheritedKey(targetToken)) {
			return Result.fail(ApplyFailure.ForbiddenKey({ key: targetToken }));
		}
		parent[targetToken] = value;
		return Result.succeed(root);
	}
	return Result.fail(ApplyFailure.NonContainer({ token: targetToken }));
};

/**
 * RFC 6902 remove: returns the removed value, so move can add it
 * - array: remove at the index
 * - object: remove the key
 */
const remove = (
	root: Schema.MutableJson,
	pointer: Pointer,
): Result.Result<Schema.MutableJson, ApplyFailure> => {
	const tokens = parsePointer(pointer);
	const targetToken = tokens.pop();

	// Cannot remove the whole document
	if (typeof targetToken === "undefined") {
		return Result.fail(ApplyFailure.ImmovableRoot());
	}

	const parentNavigateResult = navigate(root, tokens);
	if (Result.isFailure(parentNavigateResult)) {
		return parentNavigateResult;
	}
	const parent = parentNavigateResult.success;
	if (Array.isArray(parent)) {
		const idx = parseIndex(targetToken);
		if (Option.isNone(idx)) {
			return Result.fail(ApplyFailure.InvalidIndex({ token: targetToken }));
		}
		const removed = parent.splice(idx.value, 1)[0];
		if (typeof removed === "undefined") {
			return Result.fail(ApplyFailure.IndexOutOfBounds({ index: idx.value }));
		}
		return Result.succeed(removed);
	}
	if (parent !== null && typeof parent === "object") {
		if (!Object.hasOwn(parent, targetToken)) {
			return Result.fail(ApplyFailure.MissingKey({ key: targetToken }));
		}
		const removed = parent[targetToken];
		if (typeof removed === "undefined") {
			return Result.fail(ApplyFailure.MissingKey({ key: targetToken }));
		}
		delete parent[targetToken];
		return Result.succeed(removed);
	}
	return Result.fail(ApplyFailure.NonContainer({ token: targetToken }));
};

/**
 * RFC 6902 replace: returns the new document
 * - array: replace at the index
 * - object: replace on the existing key
 * - "" replaces the whole document
 */
const replace = (
	root: Schema.MutableJson,
	pointer: Pointer,
	value: Schema.MutableJson,
): Result.Result<Schema.MutableJson, ApplyFailure> => {
	const tokens = parsePointer(pointer);
	const targetToken = tokens.pop();

	// Replace the whole document for empty pointer
	if (typeof targetToken === "undefined") {
		return Result.succeed(value);
	}

	const parentNavigateResult = navigate(root, tokens);
	if (Result.isFailure(parentNavigateResult)) {
		return parentNavigateResult;
	}
	const parent = parentNavigateResult.success;
	if (Array.isArray(parent)) {
		const idx = parseIndex(targetToken);
		if (Option.isNone(idx)) {
			return Result.fail(ApplyFailure.InvalidIndex({ token: targetToken }));
		}
		if (idx.value >= parent.length) {
			return Result.fail(ApplyFailure.IndexOutOfBounds({ index: idx.value }));
		}
		parent[idx.value] = value;
		return Result.succeed(root);
	}
	if (parent !== null && typeof parent === "object") {
		if (!Object.hasOwn(parent, targetToken)) {
			return Result.fail(ApplyFailure.MissingKey({ key: targetToken }));
		}
		parent[targetToken] = value;
		return Result.succeed(root);
	}
	return Result.fail(ApplyFailure.NonContainer({ token: targetToken }));
};

/**
 * RFC 6902 move: returns the new document
 * - remove at `from`, then add the removed value at `path`
 * - moving the root out and moving into the moved subtree are rejected
 */
const move = (
	root: Schema.MutableJson,
	from: Pointer,
	path: Pointer,
): Result.Result<Schema.MutableJson, ApplyFailure> => {
	if (from === path) {
		return Result.succeed(root);
	}
	if (from === "") {
		return Result.fail(ApplyFailure.ImmovableRoot());
	}
	if (path.startsWith(`${from}/`)) {
		return Result.fail(ApplyFailure.MoveIntoSelf({ from, path }));
	}
	return remove(root, from).pipe(
		Result.flatMap((removed) => add(root, path, removed)),
	);
};

/**
 * Non-standard test-hash: the value at the pointer must still hash to `hash`, document unchanged
 */
const testHash = (
	root: Schema.MutableJson,
	pointer: Pointer,
	hash: string,
): Result.Result<Schema.MutableJson, ApplyFailure> =>
	getAtPointer(root, pointer).pipe(
		Result.flatMap((seen) => {
			const actual = computeTestHash(seen);
			if (actual !== hash) {
				return Result.fail(
					ApplyFailure.HashMismatch({ expected: hash, actual }),
				);
			}
			return Result.succeed(root);
		}),
	);

/**
 * RFC 6902 test: the value at the pointer must still equal `expected`
 */
const test = (
	root: Schema.MutableJson,
	pointer: Pointer,
	expected: Schema.Json,
): Result.Result<Schema.MutableJson, ApplyFailure> =>
	getAtPointer(root, pointer).pipe(
		Result.flatMap((seen) =>
			stableStringify(seen) === stableStringify(expected)
				? Result.succeed(root)
				: Result.fail(ApplyFailure.ValueMismatch()),
		),
	);

export const applyChangeOp = (
	root: Schema.MutableJson,
	op: ChangeOp,
): Result.Result<Schema.MutableJson, ApplyFailure> =>
	Match.value(op).pipe(
		Match.when({ op: "add" }, ({ path, value }) =>
			add(root, path, cloneJson(value)),
		),
		Match.when({ op: "remove" }, ({ path }) =>
			remove(root, path).pipe(Result.map(() => root)),
		),
		Match.when({ op: "replace" }, ({ path, value }) =>
			replace(root, path, cloneJson(value)),
		),
		Match.when({ op: "move" }, ({ from, path }) => move(root, from, path)),
		Match.exhaustive,
	);

export interface PatchFailure {
	readonly op: PatchOp;
	readonly cause: ApplyFailure;
}

export const applyPatch = (
	current: Schema.Json,
	patch: ReadonlyArray<PatchOp>,
): Result.Result<Schema.MutableJson, PatchFailure> => {
	let doc = cloneJson(current);
	for (const op of patch) {
		const result = Match.value(op).pipe(
			Match.when({ op: "test-hash" }, ({ path, hash }) =>
				testHash(doc, path, hash),
			),
			Match.when({ op: "test" }, ({ path, value }) => test(doc, path, value)),
			Match.orElse((changeOp) => applyChangeOp(doc, changeOp)),
		);
		if (Result.isFailure(result)) {
			return Result.fail({ op, cause: result.failure });
		}
		doc = result.success;
	}
	return Result.succeed(doc);
};
