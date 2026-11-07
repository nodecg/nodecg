export { applyPatch, isDrift } from "./apply.ts";
export { diffSignedPatch } from "./diff.ts";
export {
	computeFingerprint,
	computeTestHash,
	stableStringify,
} from "./hash.ts";
export {
	ChangeOp,
	Patch,
	PatchNotApplicable,
	PatchOp,
	Pointer,
	RevisionConflict,
} from "./schema.ts";
