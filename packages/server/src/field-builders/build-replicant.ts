import {
	canAccess,
	resolveReplicantAccess,
	type ReplicantFieldManifest,
	type RoleRegistry,
} from "@nodecg/core";
import {
	CurrentIdentity,
	formatField,
	type Identity,
	NamespacePath,
	type Updater,
} from "@nodecg/internal";
import type { Patch } from "@nodecg/internal/occ";
import { cloneJson } from "@nodecg/internal/utils";
import { Effect, Result, Schema, Stream } from "effect";
import type { WritableDeep } from "type-fest";

import {
	CommitContended,
	ReplicantStoreService,
	type RevisionedValue,
} from "../replicant-store.ts";
import { fieldInternal } from "./field-internal-key.ts";
import { migrationDie } from "./migration-die.ts";
import { FieldPermissionDenied } from "./permission.ts";

export class ReplicantUpdateFnError extends Schema.TaggedError<ReplicantUpdateFnError>()(
	"ReplicantUpdateFnError",
	{
		namespace: NamespacePath,
		name: Schema.String,
		cause: Schema.Defect(),
	},
) {
	override readonly message = `Update function for replicant ${formatField(this.namespace, this.name)} failed`;
}

export const buildReplicant = Effect.fn("buildReplicant")(function* <Decoded>(
	namespace: NamespacePath,
	name: string,
	manifest: ReplicantFieldManifest<Decoded>,
	registry: RoleRegistry,
	initialValue: Decoded,
) {
	const store = yield* ReplicantStoreService;
	const access = resolveReplicantAccess(registry, manifest.permission);
	const canRead = (identity: Identity) =>
		canAccess(access.read, identity, namespace, registry);
	const canWrite = (identity: Identity) =>
		canAccess(access.write, identity, namespace, registry);
	const decode = (value: Schema.Json) =>
		Effect.fromResult(manifest.decode(value));
	const encode = (value: Decoded | WritableDeep<Decoded>) =>
		Effect.fromResult(manifest.encode(value));

	const read = yield* store.initializeReplicant(
		namespace,
		name,
		decode,
		yield* encode(initialValue),
		manifest.persistent,
	);

	const retryContention = <A, E, R>(
		attempt: Effect.Effect<A, E | CommitContended, R>,
	) =>
		attempt.pipe(
			Effect.retry({
				while: Schema.is(CommitContended),
				times: 100,
			}),
			Effect.catchTag("CommitContended", () =>
				Effect.die(
					new Error(
						`Committing ${formatField(namespace, name)} lost 100 compare-and-swap attempts, is an updater writing its own field?`,
					),
				),
			),
		);

	const commit = <E>(
		produce: (current: RevisionedValue) => Effect.Effect<Schema.Json, E>,
	) => retryContention(store.commit(namespace, name, produce));

	const getResult = (identity: Identity) =>
		Result.liftPredicate(identity, canRead, () =>
			FieldPermissionDenied.make({ namespace, name, operation: "read" }),
		).pipe(
			Result.map(() => read()),
			Result.flatMap(({ value }) => manifest.decode(cloneJson(value))),
		);

	const get = Effect.fn("get")(function* () {
		const identity = yield* CurrentIdentity;
		return yield* Effect.fromResult(getResult(identity));
	});

	const getRevisioned = Effect.fn("getRevisioned")(function* () {
		const identity = yield* CurrentIdentity;
		if (!canRead(identity)) {
			return yield* FieldPermissionDenied.make({
				namespace,
				name,
				operation: "read",
			});
		}
		return read();
	});

	const set = Effect.fn("set")(function* (value: Decoded) {
		const identity = yield* CurrentIdentity;
		if (!canWrite(identity)) {
			return yield* FieldPermissionDenied.make({
				namespace,
				name,
				operation: "write",
			});
		}
		const encoded = yield* encode(value);
		yield* commit(() => Effect.succeed(cloneJson(encoded)));
	});

	// Wire write: applies the client's patch, the decode gate validates the applied document
	const commitPatch = Effect.fn("commitPatch")(function* (patch: Patch) {
		const identity = yield* CurrentIdentity;
		if (!canWrite(identity)) {
			return yield* FieldPermissionDenied.make({
				namespace,
				name,
				operation: "write",
			});
		}
		return yield* retryContention(
			store.commitPatch(namespace, name, patch, decode),
		);
	});

	const update = Effect.fn("update")(function* (updater: Updater<Decoded>) {
		const identity = yield* CurrentIdentity;
		if (!canWrite(identity)) {
			return yield* FieldPermissionDenied.make({
				namespace,
				name,
				operation: "write",
			});
		}
		yield* commit((stored) =>
			Effect.gen(function* () {
				const current = yield* Effect.fromResult(
					manifest.mutableDecode(stored.value),
				).pipe(migrationDie);
				const next = yield* Effect.try({
					try: () => {
						const result = updater(current);
						if (typeof result === "undefined") {
							return current;
						}
						return result;
					},
					catch: (error) =>
						ReplicantUpdateFnError.make({ namespace, name, cause: error }),
				});
				const encoded = yield* encode(next);
				return cloneJson(encoded);
			}),
		);
	});

	const subscribeRevisioned = Effect.fn("subscribeRevisioned")(function* () {
		return yield* store.subscribeReplicant(namespace, name);
	});

	const subscribe = Effect.fn("subscribe")(function* () {
		const stream = yield* store.subscribeReplicant(namespace, name);
		return stream.pipe(
			Stream.mapEffect((frame) =>
				decode(cloneJson(frame.value)).pipe(migrationDie),
			),
		);
	});

	return {
		get,
		set,
		update,
		validate: encode,
		subscribe,
		[fieldInternal]: {
			getResult,
			set,
			update,
			validate: encode,
			subscribe,
			getRevisioned,
			commitPatch,
			subscribeRevisioned,
			canRead,
		},
	};
});

export type ReplicantFieldEffect<Decoded> = Effect.Success<
	ReturnType<typeof buildReplicant<Decoded>>
>;
