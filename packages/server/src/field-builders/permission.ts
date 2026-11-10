import type { ResolvedPermission } from "@nodecg/core";
import {
	CurrentIdentity,
	type Identity,
	NamespacePath,
} from "@nodecg/internal";
import { Effect, Match, Result, Schema } from "effect";

export class FieldPermissionDenied extends Schema.TaggedError<FieldPermissionDenied>()(
	"FieldPermissionDenied",
	{
		namespace: NamespacePath,
		name: Schema.String,
		operation: Schema.Literals(["read", "write"]),
	},
) {
	override readonly message = `Permission denied to ${this.operation} "${this.name}" in "${this.namespace.join("/")}"`;
}

export const checkPermission = (
	permission: ResolvedPermission,
	namespace: NamespacePath,
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
	namespace: NamespacePath,
	name: string,
	operation: "read" | "write",
) =>
	Effect.gen(function* () {
		const identity = yield* CurrentIdentity;
		return yield* Effect.fromResult(
			checkPermission(permission, namespace, name, operation, identity),
		);
	});
