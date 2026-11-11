import { testLayer } from "@nodecg-private/test-utils";
import { defineNamespace } from "@nodecg/core";
import {
	AnonymousIdentitySchema,
	CurrentIdentity,
	Authentication,
	User,
	UserId,
	RoleName,
	ServerIdentity,
} from "@nodecg/internal";
import { computeTestHash } from "@nodecg/internal/occ";
import { Effect, Layer, Option, Schema, Stream } from "effect";
import { afterEach, assert, describe, expect } from "vitest";

import { ReplicantStoreService } from "../replicant-store.ts";
import { InMemoryReplicantRepository } from "../services/repository/replicant/in-memory-replicant-repository.ts";
import { createReplicantRepositoryStub } from "../services/repository/replicant/replicant-repository.stub.ts";
import { ReplicantRepositoryService } from "../services/repository/replicant/replicant-repository.ts";
import { buildReplicant } from "./build-replicant.ts";
import { fieldInternal } from "./field-internal-key.ts";

const anonymous = Layer.succeed(
	CurrentIdentity,
	AnonymousIdentitySchema.make({}),
);
const identity = Layer.succeed(CurrentIdentity, ServerIdentity.make({}));

const { stub: repository, reset } = createReplicantRepositoryStub();
afterEach(reset);

const stubbedRepository = Layer.succeed(ReplicantRepositoryService, repository);

const testStubbed = testLayer(
	Layer.mergeAll(
		stubbedRepository,
		ReplicantStoreService.layer.pipe(Layer.provide(stubbedRepository)),
		identity,
	),
);

const testInMemory = testLayer(
	Layer.mergeAll(
		InMemoryReplicantRepository,
		ReplicantStoreService.layer.pipe(
			Layer.provide(InMemoryReplicantRepository),
		),
		identity,
	),
);

// Different encoded and decoded
const manifest = defineNamespace("ns", {
	roles: { scorer: { permission: ["replicant-read", "replicant-write"] } },
	replicant: {
		count: { schema: Schema.FiniteFromString },
		other: { schema: Schema.FiniteFromString },
		live: { schema: Schema.FiniteFromString, persistent: false },
		locked: {
			schema: Schema.FiniteFromString,
			permission: { write: { deny: ["scorer"] } },
		},
		doc: {
			schema: Schema.Struct({
				count: Schema.FiniteFromString,
				data: Schema.Json,
			}),
		},
	},
});

const scorer = Layer.succeed(
	CurrentIdentity,
	User.make({
		id: UserId.make("scorer"),
		authentication: Authentication.make({ issuer: "test", subject: "subject" }),
		displayName: "Scorer",
		roles: [{ namespace: "ns", name: RoleName.make("scorer") }],
		globalRoles: [],
	}),
);

describe("buildReplicant", () => {
	testStubbed(
		"starts a replicant that is not persisted from its seed",
		Effect.gen(function* () {
			repository.read.mockReturnValue(Effect.succeed("42"));
			const field = yield* buildReplicant(
				["ns"],
				"live",
				manifest.replicant.live,
				0,
			);

			expect(yield* field.get()).toBe(0);
			expect(repository.read).not.toHaveBeenCalled();
		}),
	);

	testStubbed(
		"fails when the stored value does not match the schema",
		Effect.gen(function* () {
			repository.read.mockReturnValue(Effect.succeed("not a number"));
			const error = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				0,
			).pipe(Effect.flip);

			expect(error).toMatchObject({
				_tag: "ReplicantLoadError",
				namespace: ["ns"],
				name: "count",
				cause: {
					_tag: "FieldDecodeError",
					fieldName: "count",
					value: "not a number",
				},
			});
		}),
	);
});

describe("get", () => {
	testStubbed(
		"decodes the value held by the store",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				42,
			);
			expect(yield* field.get()).toBe(42);
		}),
	);

	testStubbed(
		"returns a value that shares nothing with the store",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"doc",
				manifest.replicant.doc,
				{
					count: 1,
					data: { tags: ["a"] },
				},
			);

			const first = yield* field.get();
			const second = yield* field.get();

			expect(first.data).not.toBe(second.data);
		}),
	);

	testStubbed(
		"fails when the stored value does not match the schema",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				0,
			);
			yield* store.commit(["ns"], "count", () =>
				Effect.succeed("not a number"),
			);
			const error = yield* field.get().pipe(Effect.flip);
			expect(error._tag).toBe("FieldDecodeError");
		}),
	);
});

describe("set", () => {
	testStubbed(
		"encodes the value and writes it to the store",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				0,
			);
			yield* field.set(7);
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toBe("7");
		}),
	);

	testStubbed(
		"keeps no reference to the value it was given",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"doc",
				manifest.replicant.doc,
				{
					count: 0,
					data: null,
				},
			);
			const tags = ["a"];

			yield* field.set({ count: 1, data: { tags } });
			tags.push("b");

			expect(yield* field.get()).toEqual({ count: 1, data: { tags: ["a"] } });
		}),
	);

	testStubbed(
		"fails when the value fails schema validation",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				0,
			);
			const error = yield* field
				.set("not a number" as unknown as number)
				.pipe(Effect.flip);
			expect(error._tag).toBe("FieldEncodeError");
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toBe("0");
		}),
	);

	testStubbed(
		"fails FieldPermissionDenied for a caller whose role the write denies",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"locked",
				manifest.replicant.locked,
				0,
			);
			const error = yield* field
				.set(1)
				.pipe(Effect.provide(scorer), Effect.flip);
			expect(error._tag).toBe("FieldPermissionDenied");
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toBe("0");
		}),
	);
});

describe("update", () => {
	testStubbed(
		"reads the current value, applies the fn, and writes the result",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				10,
			);
			yield* field.update((v) => v + 3);
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toBe("13");
		}),
	);

	testStubbed(
		"keeps no reference to the value the fn returns",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"doc",
				manifest.replicant.doc,
				{
					count: 0,
					data: null,
				},
			);
			const tags = ["a"];

			yield* field.update(() => ({ count: 1, data: { tags } }));
			tags.push("b");

			expect(yield* field.get()).toEqual({ count: 1, data: { tags: ["a"] } });
		}),
	);

	testStubbed(
		"surfaces a throwing update fn as ReplicantUpdateFnError without writing",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				10,
			);
			const error = yield* field
				.update(() => {
					throw new Error("boom");
				})
				.pipe(Effect.flip);
			expect(error._tag).toBe("ReplicantUpdateFnError");
			expect(error.cause).toEqual(new Error("boom"));
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toBe("10");
		}),
	);

	testStubbed(
		"keeps a thrown value that is not an Error as the cause",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				10,
			);
			const error = yield* field
				.update(() => {
					throw "bad value";
				})
				.pipe(Effect.flip);
			expect(error.cause).toBe("bad value");
		}),
	);

	testStubbed(
		"mutating the draft in place writes the encoded mutated value",
		Effect.gen(function* () {
			const box = defineNamespace("ns", {
				replicant: {
					box: { schema: Schema.Struct({ n: Schema.FiniteFromString }) },
				},
			});
			const field = yield* buildReplicant(["ns"], "box", box.replicant.box, {
				n: 1,
			});
			yield* field.update((draft) => {
				draft.n = 5;
			});
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toEqual({ n: "5" });
		}),
	);

	testStubbed(
		"retries against the fresh value when a concurrent commit lands mid-produce",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const context = yield* Effect.context<never>();
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				10,
			);
			let raced = false;
			yield* field.update((v) => {
				if (!raced) {
					raced = true;
					Effect.runForkWith(context)(
						store.commit(["ns"], "count", () => Effect.succeed("100")),
					);
				}
				return v + 3;
			});

			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toBe("103");
		}),
	);
});

describe("validate", () => {
	testStubbed(
		"encodes a valid value and fails an invalid one",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				0,
			);
			expect(yield* field.validate(7)).toBe("7");
			const error = yield* field
				.validate("nope" as unknown as number)
				.pipe(Effect.flip);
			expect(error._tag).toBe("FieldEncodeError");
		}),
	);
});

describe("subscribe", () => {
	testInMemory(
		"emits decoded values on set",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			yield* repository.write(["ns"], "count", "0");
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				0,
			);

			const stream = yield* field.subscribe();
			yield* field.set(7);

			const events = yield* stream.pipe(Stream.take(2), Stream.runCollect);
			expect(events).toEqual([0, 7]);
		}),
	);

	testInMemory(
		"emits values that share nothing with the store",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"doc",
				manifest.replicant.doc,
				{
					count: 1,
					data: { tags: ["a"] },
				},
			);

			const first = yield* field
				.subscribe()
				.pipe(Effect.flatMap(Stream.runHead));
			const second = yield* field
				.subscribe()
				.pipe(Effect.flatMap(Stream.runHead));

			assert(Option.isSome(first) && Option.isSome(second));
			expect(first.value.data).not.toBe(second.value.data);
		}),
	);

	testInMemory(
		"filters out updates to other fields",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			yield* repository.write(["ns"], "count", "0");
			yield* repository.write(["ns"], "other", "0");
			const count = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				0,
			);
			const other = yield* buildReplicant(
				["ns"],
				"other",
				manifest.replicant.other,
				0,
			);

			const stream = yield* count.subscribe();
			yield* other.set(99);
			yield* count.set(3);

			const events = yield* stream.pipe(Stream.take(2), Stream.runCollect);
			expect(events).toEqual([0, 3]);
		}),
	);

	testInMemory(
		"[fieldInternal].subscribeRevisioned streams this field's frames",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			yield* repository.write(["ns"], "count", "0");
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				0,
			);

			const stream = yield* field[fieldInternal].subscribeRevisioned();
			yield* field.set(42);

			const events = yield* stream.pipe(Stream.take(2), Stream.runCollect);
			expect(events).toEqual([
				{ value: "0", revision: 0, delta: Option.none() },
				{ value: "42", revision: 1, delta: Option.none() },
			]);
		}),
	);
});

describe("store write-through", () => {
	testStubbed(
		"set, commitPatch, and update feed the store replicant",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"count",
				manifest.replicant.count,
				0,
			);

			yield* field.set(7);
			const afterSet = yield* field[fieldInternal].getRevisioned();
			expect(afterSet.value).toEqual("7");

			yield* field[fieldInternal].commitPatch([
				{ op: "replace", path: "", value: "8" },
			]);
			const afterPatch = yield* field[fieldInternal].getRevisioned();
			expect(afterPatch.value).toEqual("8");

			yield* field.update((v) => v + 3);
			const afterUpdate = yield* field[fieldInternal].getRevisioned();
			expect(afterUpdate.value).toEqual("11");
		}),
	);

	testStubbed(
		"a failed write leaves the replicant untouched",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"locked",
				manifest.replicant.locked,
				0,
			);
			yield* field.set(1).pipe(Effect.provide(scorer), Effect.flip);
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toEqual("0");
		}),
	);
});

describe("encoded read/write enforce permission", () => {
	const permissioned = defineNamespace("ns", {
		replicant: {
			open: {
				schema: Schema.Finite,
				permission: {
					read: { everyone: "allow" },
					write: { everyone: "allow" },
				},
			},
			locked: { schema: Schema.Finite },
		},
	});

	testStubbed(
		"getRevisioned returns the raw stored value and revision for an allowed caller",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"open",
				permissioned.replicant.open,
				42,
			);
			expect(
				yield* field[fieldInternal]
					.getRevisioned()
					.pipe(Effect.provide(anonymous)),
			).toEqual({ value: 42, revision: 0 });
		}),
	);

	testStubbed(
		"getRevisioned fails FieldPermissionDenied for a denied caller",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"locked",
				permissioned.replicant.locked,
				0,
			);
			const error = yield* field[fieldInternal]
				.getRevisioned()
				.pipe(Effect.provide(anonymous), Effect.flip);
			expect(error._tag).toBe("FieldPermissionDenied");
		}),
	);

	testStubbed(
		"commitPatch validates and writes for an allowed caller",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"open",
				permissioned.replicant.open,
				0,
			);
			const committed = yield* field[fieldInternal]
				.commitPatch([{ op: "replace", path: "", value: 7 }])
				.pipe(Effect.provide(anonymous));
			expect(committed).toEqual({ value: 7, revision: 1 });
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toBe(7);
		}),
	);

	testStubbed(
		"commitPatch fails FieldDecodeError and does not write for an invalid applied document",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"open",
				permissioned.replicant.open,
				0,
			);
			const error = yield* field[fieldInternal]
				.commitPatch([{ op: "replace", path: "", value: "not a number" }])
				.pipe(Effect.provide(anonymous), Effect.flip);
			expect(error._tag).toBe("FieldDecodeError");
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toBe(0);
		}),
	);

	testStubbed(
		"commitPatch fails FieldPermissionDenied and does not write for a denied caller",
		Effect.gen(function* () {
			const field = yield* buildReplicant(
				["ns"],
				"locked",
				permissioned.replicant.locked,
				0,
			);
			const error = yield* field[fieldInternal]
				.commitPatch([{ op: "replace", path: "", value: 7 }])
				.pipe(Effect.provide(anonymous), Effect.flip);
			expect(error._tag).toBe("FieldPermissionDenied");
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toBe(0);
		}),
	);
});

describe("commitPatch", () => {
	const nested = defineNamespace("ns", {
		replicant: {
			doc: {
				schema: Schema.Struct({
					a: Schema.FiniteFromString,
					b: Schema.FiniteFromString,
				}),
			},
		},
	});

	testStubbed(
		"applies a field-level replace and validates the applied document",
		Effect.gen(function* () {
			const field = yield* buildReplicant(["ns"], "doc", nested.replicant.doc, {
				a: 1,
				b: 2,
			});
			const committed = yield* field[fieldInternal].commitPatch([
				{ op: "replace", path: "/a", value: "5" },
			]);
			expect(committed).toEqual({ value: { a: "5", b: "2" }, revision: 1 });
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toEqual({ a: "5", b: "2" });
		}),
	);

	testStubbed(
		"fails PatchNotApplicable when the patch fits no document",
		Effect.gen(function* () {
			const field = yield* buildReplicant(["ns"], "doc", nested.replicant.doc, {
				a: 1,
				b: 2,
			});
			const error = yield* field[fieldInternal]
				.commitPatch([{ op: "remove", path: "" }])
				.pipe(Effect.flip);
			assert(error._tag === "PatchNotApplicable");
			expect(error.path).toBe("");
			expect(error.reason).toBe("ImmovableRoot");
			const { value } = yield* field[fieldInternal].getRevisioned();
			expect(value).toEqual({ a: "1", b: "2" });
		}),
	);

	testStubbed(
		"fails RevisionConflict when a precondition no longer holds",
		Effect.gen(function* () {
			const field = yield* buildReplicant(["ns"], "doc", nested.replicant.doc, {
				a: 1,
				b: 2,
			});
			const error = yield* field[fieldInternal]
				.commitPatch([
					{ op: "test-hash", path: "/a", hash: computeTestHash("9") },
					{ op: "replace", path: "/a", value: "5" },
				])
				.pipe(Effect.flip);
			assert(error._tag === "RevisionConflict");
			expect(error.value).toEqual({ a: "1", b: "2" });
			expect(error.revision).toBe(0);
			expect(error.reason).toBe("HashMismatch");
		}),
	);
});
