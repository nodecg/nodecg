// Diff producer of the OCC mechanism, turning a base and a next document into
// the RFC 6902 ops that carry the change.

import { Data, Result, Schema } from "effect";
import stringify from "fast-json-stable-stringify";
import { create } from "jsondiffpatch";
import { format } from "jsondiffpatch/formatters/jsonpatch";

import { cloneJson } from "../utils/clone.ts";
import { type ApplyFailure, applyChangeOp, getAtPointer } from "./apply.ts";
import { computeTestHash } from "./hash.ts";
import {
	type AddOp,
	ChangeOp,
	type PatchOp,
	Pointer,
	type TestHashOp,
} from "./schema.ts";

export type DiffFailure = Data.TaggedEnum<{
	UnknownOp: { readonly cause: Schema.SchemaError };
	ReplayDisagreement: {
		readonly op: ChangeOp;
		readonly cause: ApplyFailure;
	};
}>;
export const DiffFailure = Data.taggedEnum<DiffFailure>();

const validateChanges = Schema.decodeUnknownResult(
	Schema.toType(Schema.Array(ChangeOp)),
);
const isPointer = Schema.is(Pointer);

const differ = create({
	objectHash: (item: object) => stringify(item),
	arrays: { detectMove: true },
});

export const diffPatch = (base: Schema.Json, next: Schema.Json) =>
	validateChanges(format(differ.diff(base, next)));

// Diff formatter does not use the append form "-"
const toAppendForm = (doc: Schema.MutableJson, op: AddOp) => {
	const cut = op.path.lastIndexOf("/");
	const parentPath = op.path.slice(0, cut);
	if (!isPointer(parentPath)) {
		return op;
	}
	const parent = getAtPointer(doc, parentPath);
	if (Result.isFailure(parent) || !Array.isArray(parent.success)) {
		return op;
	}
	if (String(parent.success.length) !== op.path.slice(cut + 1)) {
		return op;
	}
	return { op: op.op, path: `${parentPath}/-` as const, value: op.value };
};

// Only an existing target gets a precondition, so concurrent adds of different new keys cannot false-conflict
const signOp = (doc: Schema.MutableJson, op: ChangeOp) => {
	const target = op.op === "move" ? op.from : op.path;
	const seen = getAtPointer(doc, target);
	if (Result.isFailure(seen)) {
		return [];
	}
	const signature: TestHashOp = {
		op: "test-hash",
		path: target,
		hash: computeTestHash(seen.success),
	};
	return [signature];
};

const signChanges = (
	base: Schema.Json,
	changes: ReadonlyArray<ChangeOp>,
): Result.Result<ReadonlyArray<PatchOp>, DiffFailure> => {
	const signed: PatchOp[] = [];
	let doc = cloneJson(base);
	for (const change of changes) {
		const op = change.op === "add" ? toAppendForm(doc, change) : change;
		signed.push(...signOp(doc, op), op);
		const applied = applyChangeOp(doc, op);
		if (Result.isFailure(applied)) {
			return Result.fail(
				DiffFailure.ReplayDisagreement({ op, cause: applied.failure }),
			);
		}
		doc = applied.success;
	}
	return Result.succeed(signed);
};

export const diffSignedPatch = (base: Schema.Json, next: Schema.Json) =>
	diffPatch(base, next).pipe(
		Result.mapError((cause) => DiffFailure.UnknownOp({ cause })),
		Result.flatMap((changes) => signChanges(base, changes)),
	);
