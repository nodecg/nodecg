import {
	canAccess,
	resolveComputedAccess,
	type ComputedFieldManifest,
	type RoleRegistry,
} from "@nodecg/core";
import {
	CurrentIdentity,
	type Identity,
	type NamespacePath,
} from "@nodecg/internal";
import { cloneJson } from "@nodecg/internal/utils";
import { Effect, Result, Stream } from "effect";

import {
	type ComputeFailure,
	ReplicantStoreService,
} from "../replicant-store.ts";
import { fieldInternal } from "./field-internal-key.ts";
import { migrationDie } from "./migration-die.ts";
import { FieldPermissionDenied } from "./permission.ts";

export const buildComputed = Effect.fn("buildComputed")(function* <Decoded>(
	namespace: NamespacePath,
	name: string,
	manifest: ComputedFieldManifest<Decoded>,
	registry: RoleRegistry,
	roleNamespace: string,
	computeValue: () => Result.Result<Decoded, ComputeFailure>,
) {
	const store = yield* ReplicantStoreService;
	const access = resolveComputedAccess(registry, manifest.permission);
	const canRead = (identity: Identity) =>
		canAccess(access.read, identity, roleNamespace, registry);
	const read = yield* store.initializeComputed(namespace, name, () =>
		computeValue().pipe(
			Result.flatMap((value) => manifest.encode(value)),
			Result.map(cloneJson),
		),
	);

	const getResult = (identity: Identity) =>
		Result.liftPredicate(identity, canRead, () =>
			FieldPermissionDenied.make({ namespace, name, operation: "read" }),
		).pipe(
			Result.flatMap(() => read()),
			Result.flatMap((encoded) => manifest.decode(cloneJson(encoded))),
		);

	const get = Effect.fn("get")(function* () {
		const identity = yield* CurrentIdentity;
		return yield* Effect.fromResult(getResult(identity));
	});

	const getEncodedNoAuth = Effect.fn("getEncodedNoAuth")(function* () {
		return yield* Effect.fromResult(read());
	});

	const getEncoded = Effect.fn("getEncoded")(function* () {
		const identity = yield* CurrentIdentity;
		if (!canRead(identity)) {
			return yield* FieldPermissionDenied.make({
				namespace,
				name,
				operation: "read",
			});
		}
		return yield* Effect.fromResult(read());
	});

	const subscribeEncoded = Effect.fn("subscribeEncoded")(function* () {
		return yield* store.subscribeComputed(namespace, name);
	});

	const subscribe = Effect.fn("subscribe")(function* () {
		const stream = yield* subscribeEncoded();
		return stream.pipe(
			Stream.mapEffect((value) =>
				Effect.fromResult(manifest.decode(cloneJson(value))).pipe(migrationDie),
			),
		);
	});

	return {
		get,
		subscribe,
		[fieldInternal]: {
			getResult,
			subscribe,
			getEncodedNoAuth,
			getEncoded,
			subscribeEncoded,
			canRead,
		},
	};
});

export type ComputedFieldEffect<Decoded> = Effect.Success<
	ReturnType<typeof buildComputed<Decoded>>
>;
