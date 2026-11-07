import type { ResolvedPermission } from "@nodecg-next/core";
import { CurrentIdentity, type Identity } from "@nodecg-next/internal";
import { Effect, Match, Result, Schema } from "effect";

export class FieldPermissionDenied extends Schema.TaggedError<FieldPermissionDenied>()(
	"FieldPermissionDenied",
	{
		namespace: Schema.String,
		name: Schema.String,
		operation: Schema.Literals(["read", "write"]),
	},
) {
	override readonly message = `Permission denied to ${this.operation} "${this.name}" in "${this.namespace}"`;
}

export const checkPermission = (
	permission: ResolvedPermission,
	namespace: string,
	name: string,
	operation: "read" | "write",
	identity: Identity,
): Result.Result<void, FieldPermissionDenied> => {
	const allowed = Match.value(operation).pipe(
		Match.when("read", () => permission.canRead(identity)),
		Match.when("write", () => permission.canWrite(identity)),
		Match.exhaustive,
	);
	if (!allowed) {
		return Result.fail(
			FieldPermissionDenied.make({ namespace, name, operation }),
		);
	}
	return Result.void;
};

export const requirePermission = (
	permission: ResolvedPermission,
	namespace: string,
	name: string,
	operation: "read" | "write",
) =>
	Effect.gen(function* () {
		const identity = yield* CurrentIdentity;
		return yield* Effect.fromResult(
			checkPermission(permission, namespace, name, operation, identity),
		);
	});
