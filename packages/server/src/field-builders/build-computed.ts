import type { FieldManifest } from "@nodecg-next/core";
import { CurrentIdentity, type Identity } from "@nodecg-next/internal";
import { cloneJson } from "@nodecg-next/internal/utils";
import { Effect, Result, Stream } from "effect";

import {
	type ComputedComputeError,
	ReplicantStoreService,
} from "../replicant-store.ts";
import { fieldInternal } from "./field-internal-key.ts";
import { migrationDie } from "./migration-die.ts";
import { checkPermission, requirePermission } from "./permission.ts";

export const buildComputed = Effect.fn("buildComputed")(function* <Decoded>(
	namespace: string,
	name: string,
	manifest: FieldManifest<Decoded>,
	computeValue: () => Result.Result<Decoded, ComputedComputeError>,
) {
	const store = yield* ReplicantStoreService;
	const read = yield* store.initializeComputed(namespace, name, () =>
		computeValue().pipe(
			Result.flatMap((value) => manifest.encode(value)),
			Result.map(cloneJson),
		),
	);

	const getResult = (identity: Identity) =>
		checkPermission(
			manifest.permission,
			namespace,
			name,
			"read",
			identity,
		).pipe(
			Result.flatMap(read),
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
		yield* requirePermission(manifest.permission, namespace, name, "read");
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
			permission: manifest.permission,
		},
	};
});

export type ComputedFieldEffect<Decoded> = Effect.Success<
	ReturnType<typeof buildComputed<Decoded>>
>;
