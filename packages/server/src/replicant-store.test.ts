import { FieldDecodeError } from "@nodecg-next/core";
import { computeFingerprint, computeTestHash } from "@nodecg-next/internal/occ";
import { testLayer } from "@nodecg-next/test-utils";
import {
	Cause,
	Context,
	Deferred,
	Effect,
	Exit,
	Layer,
	Option,
	Result,
	Schema,
	Scope,
	Stream,
} from "effect";
import { afterEach, assert, describe, expect, vi } from "vitest";

import {
	ComputedComputeError,
	type ComputedResult,
	ReplicantAlreadyRegistered,
	ReplicantStoreService,
	type ReplicantFrame,
	ReplicantLoadError,
} from "./replicant-store.ts";
import { InMemoryReplicantRepository } from "./services/repository/replicant/in-memory-replicant-repository.ts";
import { createReplicantRepositoryStub } from "./services/repository/replicant/replicant-repository.stub.ts";
import {
	DecodeError,
	ReplicantRepositoryService,
} from "./services/repository/replicant/replicant-repository.ts";
import { BackendError } from "./services/repository/repository-errors.ts";

const test = testLayer(
	ReplicantStoreService.layer.pipe(Layer.provide(InMemoryReplicantRepository)),
);

const { stub: repository, reset } = createReplicantRepositoryStub();
afterEach(reset);

const testStubbed = testLayer(
	Layer.succeed(ReplicantRepositoryService, repository),
);

class Invalid extends Schema.TaggedError<Invalid>()("Invalid", {}) {}

const waitFor = (assertion: () => void) =>
	Effect.promise(() => vi.waitFor(assertion));

const storeIn = (scope: Scope.Scope) =>
	Layer.build(ReplicantStoreService.layer).pipe(
		Effect.map((context) => Context.get(context, ReplicantStoreService)),
		Scope.provide(scope),
	);

describe("commit", () => {
	test(
		"commits a whole value, read back with the revision bumped",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				1,
				true,
			);
			expect(readA()).toEqual({ value: 1, revision: 0 });
			const committed = yield* store.commit("ns", "a", () => Effect.succeed(2));
			expect(committed).toEqual({ value: 2, revision: 1 });
			expect(readA()).toEqual({ value: 2, revision: 1 });
		}),
	);

	test(
		"a value-equal commit does not bump the revision",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ x: 1 },
				true,
			);
			yield* store.commit("ns", "a", () => Effect.succeed({ x: 2 }));
			const before = readA();
			const committed = yield* store.commit("ns", "a", () =>
				Effect.succeed({ x: 2 }),
			);
			expect(committed).toEqual(before);
			expect(readA()).toEqual(before);
		}),
	);

	test(
		"a commit equal in content but different in key order does not bump the revision",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ x: 1, y: 2 },
				true,
			);
			const committed = yield* store.commit("ns", "a", () =>
				Effect.succeed({ y: 2, x: 1 }),
			);
			expect(committed).toEqual({ value: { x: 1, y: 2 }, revision: 0 });
			expect(readA()).toEqual({ value: { x: 1, y: 2 }, revision: 0 });
		}),
	);

	test(
		"a value-equal commit does not re-evaluate dependents",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ x: 1 },
				true,
			);
			let evaluations = 0;
			yield* store.initializeComputed("ns", "c", () => {
				evaluations += 1;
				return Result.succeed(readA().value);
			});
			yield* store.subscribeComputed("ns", "c").pipe(Effect.asVoid);
			expect(evaluations).toBe(1);
			yield* store.commit("ns", "a", () => Effect.succeed({ x: 1 }));
			expect(evaluations).toBe(1);
			yield* store.commit("ns", "a", () => Effect.succeed({ x: 2 }));
			expect(evaluations).toBe(2);
		}),
	);

	test(
		"produces the next value from the current one and bumps the revision",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				1,
				true,
			);
			const committed = yield* store.commit("ns", "a", ({ value }) =>
				Effect.succeed(typeof value === "number" ? value + 1 : 0),
			);
			expect(committed).toEqual({ value: 2, revision: 1 });
			expect(readA()).toEqual({ value: 2, revision: 1 });
		}),
	);

	test(
		"a produce yielding the current value does not bump the revision",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ x: 1 },
				true,
			);
			const committed = yield* store.commit("ns", "a", () =>
				Effect.succeed({ x: 1 }),
			);
			expect(committed).toEqual({ value: { x: 1 }, revision: 0 });
		}),
	);

	test(
		"an updater may write another replicant mid-produce",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeReplicant("ns", "a", Effect.succeed, 1, true);
			const readB = yield* store.initializeReplicant(
				"ns",
				"b",
				Effect.succeed,
				1,
				true,
			);
			const committed = yield* store.commit("ns", "a", ({ value }) =>
				store
					.commit("ns", "b", () => Effect.succeed(5))
					.pipe(Effect.as(typeof value === "number" ? value + 1 : 0)),
			);
			expect(committed.value).toBe(2);
			expect(readB().value).toBe(5);
		}),
	);

	test(
		"a single attempt fails CommitContended when a concurrent commit lands between produce and commit",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				1,
				true,
			);
			const error = yield* store
				.commit("ns", "a", ({ value }) =>
					store
						.commit("ns", "a", () => Effect.succeed(100))
						.pipe(Effect.as(typeof value === "number" ? value + 1 : 0)),
				)
				.pipe(Effect.flip);
			expect(error._tag).toBe("CommitContended");
			// The concurrent write landed, the losing attempt did not overwrite it.
			expect(readA().value).toBe(100);
		}),
	);

	test(
		"fails for an unregistered replicant",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const error = yield* store
				.commit("ns", "missing", () => Effect.succeed(1))
				.pipe(Effect.flip);
			expect(error._tag).toBe("UnknownReplicant");
		}),
	);
});

describe("commitPatch", () => {
	const noValidate = () => Effect.void;

	test(
		"applies a field-level patch and bumps the revision",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ a: 1, b: 2 },
				true,
			);
			const committed = yield* store.commitPatch(
				"ns",
				"a",
				[{ op: "replace", path: "/a", value: 5 }],
				noValidate,
			);
			expect(committed).toEqual({ value: { a: 5, b: 2 }, revision: 1 });
			expect(readA()).toEqual({ value: { a: 5, b: 2 }, revision: 1 });
		}),
	);

	test(
		"a malformed op fails PatchNotApplicable and leaves the value untouched",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ list: [1] },
				true,
			);
			const error = yield* store
				.commitPatch(
					"ns",
					"a",
					[{ op: "remove", path: "/list/notAnIndex" }],
					noValidate,
				)
				.pipe(Effect.flip);
			assert(error._tag === "PatchNotApplicable");
			expect(error.path).toBe("/list/notAnIndex");
			expect(error.reason).toBe("InvalidIndex");
			expect(readA()).toEqual({ value: { list: [1] }, revision: 0 });
		}),
	);

	test(
		"a target that moved on fails RevisionConflict carrying the current value",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ a: 1 },
				true,
			);
			const error = yield* store
				.commitPatch(
					"ns",
					"a",
					[{ op: "replace", path: "/missing", value: 5 }],
					noValidate,
				)
				.pipe(Effect.flip);
			assert(error._tag === "RevisionConflict");
			expect(error.value).toEqual({ a: 1 });
			expect(error.revision).toBe(0);
			expect(error.reason).toBe("MissingKey");
		}),
	);

	test(
		"a move whose destination drifted out of range fails RevisionConflict",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				["a", "b", "c"],
				true,
			);
			const error = yield* store
				.commitPatch(
					"ns",
					"a",
					[
						{ op: "test-hash", path: "/0", hash: computeTestHash("a") },
						{ op: "move", from: "/0", path: "/4" },
					],
					noValidate,
				)
				.pipe(Effect.flip);
			assert(error._tag === "RevisionConflict");
			expect(error.reason).toBe("IndexOutOfBounds");
			expect(readA()).toEqual({ value: ["a", "b", "c"], revision: 0 });
		}),
	);

	test(
		"a stale precondition fails RevisionConflict even with no change op to apply",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ a: 1 },
				true,
			);
			const error = yield* store
				.commitPatch(
					"ns",
					"a",
					[{ op: "test-hash", path: "/a", hash: computeTestHash(2) }],
					noValidate,
				)
				.pipe(Effect.flip);
			assert(error._tag === "RevisionConflict");
			expect(error.reason).toBe("HashMismatch");
		}),
	);

	test(
		"a stale test precondition fails RevisionConflict",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ a: 1 },
				true,
			);
			const error = yield* store
				.commitPatch(
					"ns",
					"a",
					[{ op: "test", path: "/a", value: 2 }],
					noValidate,
				)
				.pipe(Effect.flip);
			assert(error._tag === "RevisionConflict");
			expect(error.reason).toBe("ValueMismatch");
		}),
	);

	test(
		"a passing precondition with no change op returns the current value without committing",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ a: 1 },
				true,
			);
			const committed = yield* store.commitPatch(
				"ns",
				"a",
				[{ op: "test-hash", path: "/a", hash: computeTestHash(1) }],
				noValidate,
			);
			expect(committed).toEqual({ value: { a: 1 }, revision: 0 });
		}),
	);

	test(
		"a validate failure propagates and nothing is written",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ a: 1 },
				true,
			);
			const error = yield* store
				.commitPatch("ns", "a", [{ op: "replace", path: "/a", value: 5 }], () =>
					Invalid.make(),
				)
				.pipe(Effect.flip);
			expect(error).toEqual(Invalid.make());
			expect(readA()).toEqual({ value: { a: 1 }, revision: 0 });
		}),
	);

	test(
		"a patch applying to the current value does not bump the revision",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ a: 1 },
				true,
			);
			const committed = yield* store.commitPatch(
				"ns",
				"a",
				[{ op: "replace", path: "/a", value: 1 }],
				noValidate,
			);
			expect(committed).toEqual({ value: { a: 1 }, revision: 0 });
		}),
	);

	test(
		"fails for an unregistered replicant",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const error = yield* store
				.commitPatch(
					"ns",
					"missing",
					[{ op: "replace", path: "", value: 1 }],
					noValidate,
				)
				.pipe(Effect.flip);
			expect(error._tag).toBe("UnknownReplicant");
		}),
	);
});

describe("subscribeReplicant", () => {
	test(
		"seeds with a snapshot frame then emits a frame per commit",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeReplicant("ns", "a", Effect.succeed, 1, true);
			yield* store.commit("ns", "a", () => Effect.succeed(2));
			const stream = yield* store.subscribeReplicant("ns", "a");
			const frames: ReplicantFrame[] = [];
			yield* Stream.runForEach(stream, (frame) =>
				Effect.sync(() => frames.push(frame)),
			).pipe(Effect.forkChild);

			yield* waitFor(() =>
				expect(frames).toEqual([
					{ value: 2, revision: 1, delta: Option.none() },
				]),
			);
			yield* store.commit("ns", "a", () => Effect.succeed(3));
			yield* waitFor(() =>
				expect(frames).toEqual([
					{ value: 2, revision: 1, delta: Option.none() },
					{ value: 3, revision: 2, delta: Option.none() },
				]),
			);
		}),
	);

	test(
		"emits no frame for a commit of the current value",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ x: 1 },
				true,
			);
			const stream = yield* store.subscribeReplicant("ns", "a");
			const frames: ReplicantFrame[] = [];
			yield* Stream.runForEach(stream, (frame) =>
				Effect.sync(() => frames.push(frame)),
			).pipe(Effect.forkChild);

			yield* waitFor(() =>
				expect(frames).toEqual([
					{ value: { x: 1 }, revision: 0, delta: Option.none() },
				]),
			);
			yield* store.commit("ns", "a", () => Effect.succeed({ x: 1 }));
			yield* store.commit("ns", "a", () => Effect.succeed({ x: 2 }));
			yield* waitFor(() =>
				expect(frames).toEqual([
					{ value: { x: 1 }, revision: 0, delta: Option.none() },
					{ value: { x: 2 }, revision: 1, delta: Option.none() },
				]),
			);
		}),
	);

	test(
		"filters out commits to other replicants",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeReplicant("ns", "a", Effect.succeed, 1, true);
			yield* store.initializeReplicant("ns", "b", Effect.succeed, 1, true);
			const stream = yield* store.subscribeReplicant("ns", "a");
			const frames: ReplicantFrame[] = [];
			yield* Stream.runForEach(stream, (frame) =>
				Effect.sync(() => frames.push(frame)),
			).pipe(Effect.forkChild);

			yield* waitFor(() =>
				expect(frames).toEqual([
					{ value: 1, revision: 0, delta: Option.none() },
				]),
			);
			yield* store.commit("ns", "b", () => Effect.succeed(99));
			yield* store.commit("ns", "a", () => Effect.succeed(2));
			yield* waitFor(() =>
				expect(frames).toEqual([
					{ value: 1, revision: 0, delta: Option.none() },
					{ value: 2, revision: 1, delta: Option.none() },
				]),
			);
		}),
	);

	test(
		"a patch commit emits a delta frame carrying only its change ops",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				{ a: 1, b: 2 },
				true,
			);
			const stream = yield* store.subscribeReplicant("ns", "a");
			const frames: ReplicantFrame[] = [];
			yield* Stream.runForEach(stream, (frame) =>
				Effect.sync(() => frames.push(frame)),
			).pipe(Effect.forkChild);

			yield* waitFor(() =>
				expect(frames).toEqual([
					{ value: { a: 1, b: 2 }, revision: 0, delta: Option.none() },
				]),
			);
			yield* store.commitPatch(
				"ns",
				"a",
				[
					{ op: "test-hash", path: "/a", hash: computeTestHash(1) },
					{ op: "replace", path: "/a", value: 5 },
				],
				() => Effect.void,
			);
			yield* waitFor(() =>
				expect(frames).toEqual([
					{ value: { a: 1, b: 2 }, revision: 0, delta: Option.none() },
					{
						value: { a: 5, b: 2 },
						revision: 1,
						delta: Option.some({
							ops: [{ op: "replace", path: "/a", value: 5 }],
							baseRevision: 0,
							hash: computeFingerprint({ a: 5, b: 2 }),
						}),
					},
				]),
			);
		}),
	);

	test(
		"fails for an unregistered replicant",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const error = yield* store
				.subscribeReplicant("ns", "missing")
				.pipe(Effect.flip);
			expect(error._tag).toBe("UnknownReplicant");
		}),
	);
});

describe("persistence", () => {
	testStubbed(
		"persists each written value, in write order",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			const store = yield* storeIn(scope);
			yield* store.initializeReplicant("ns", "a", Effect.succeed, 0, true);
			repository.write.mockClear();

			yield* store.commit("ns", "a", () => Effect.succeed(1));
			yield* store.commit("ns", "a", () => Effect.succeed(2));
			yield* store.commit("ns", "a", () => Effect.succeed(3));

			yield* waitFor(() => expect(repository.write).toHaveBeenCalledTimes(3));
			expect(repository.write.mock.calls).toEqual([
				["ns", "a", 1],
				["ns", "a", 2],
				["ns", "a", 3],
			]);
		}),
	);

	testStubbed(
		"closing the scope persists every queued write, in write order",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			const store = yield* storeIn(scope);
			yield* store.initializeReplicant("ns", "a", Effect.succeed, 0, true);
			repository.write.mockClear();
			const gate = yield* Deferred.make<void>();
			repository.write.mockImplementation((_namespace, _name, value) =>
				value === 1 ? Deferred.await(gate) : Effect.void,
			);

			yield* store.commit("ns", "a", () => Effect.succeed(1));
			yield* store.commit("ns", "a", () => Effect.succeed(2));
			yield* store.commit("ns", "a", () => Effect.succeed(3));
			yield* waitFor(() => expect(repository.write).toHaveBeenCalledTimes(1));
			yield* Scope.addFinalizer(scope, Deferred.succeed(gate, undefined));

			expect(repository.write.mock.calls).toEqual([["ns", "a", 1]]);

			yield* Scope.close(scope, Exit.void);
			expect(repository.write.mock.calls).toEqual([
				["ns", "a", 1],
				["ns", "a", 2],
				["ns", "a", 3],
			]);
		}),
	);

	testStubbed(
		"closing the scope does not write a replicant with no pending write",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			const store = yield* storeIn(scope);
			yield* store.initializeReplicant("ns", "a", Effect.succeed, 0, true);
			yield* store.initializeReplicant("ns", "b", Effect.succeed, 0, true);
			yield* store.commit("ns", "a", () => Effect.succeed(1));
			yield* waitFor(() =>
				expect(repository.write).toHaveBeenCalledWith("ns", "a", 1),
			);
			repository.write.mockClear();

			yield* Scope.close(scope, Exit.void);
			expect(repository.write).not.toHaveBeenCalled();
		}),
	);

	testStubbed(
		"skips writes to a replicant that is not persisted",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			const store = yield* storeIn(scope);
			yield* store.initializeReplicant("ns", "a", Effect.succeed, 0, false);
			yield* store.initializeReplicant("ns", "b", Effect.succeed, 0, true);
			repository.write.mockClear();

			yield* store.commit("ns", "a", () => Effect.succeed(1));
			yield* store.commit("ns", "b", () => Effect.succeed(1));

			yield* waitFor(() => expect(repository.write).toHaveBeenCalledTimes(1));
			expect(repository.write.mock.calls).toEqual([["ns", "b", 1]]);
		}),
	);

	testStubbed(
		"a failed write is logged, not surfaced to the writer",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			const store = yield* storeIn(scope);
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				0,
				true,
			);
			repository.write.mockClear();
			repository.write.mockReturnValue(
				BackendError.make({ cause: new Error("disk full") }),
			);

			yield* store.commit("ns", "a", () => Effect.succeed(1));

			yield* waitFor(() => expect(repository.write).toHaveBeenCalledTimes(1));
			expect(readA().value).toBe(1);
		}),
	);
});

describe("initializeReplicant", () => {
	testStubbed(
		"persists the default value when nothing is stored",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			const store = yield* storeIn(scope);
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				0,
				true,
			);

			expect(repository.read).toHaveBeenCalledWith("ns", "a");
			expect(repository.write).toHaveBeenCalledWith("ns", "a", 0);
			expect(readA().value).toBe(0);
		}),
	);

	testStubbed(
		"adopts the stored value and does not write it back",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			repository.read.mockReturnValue(Effect.succeed(42));
			const store = yield* storeIn(scope);
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				0,
				true,
			);

			expect(readA().value).toBe(42);
			expect(repository.write).not.toHaveBeenCalled();
		}),
	);

	testStubbed(
		"does not read or write a replicant that is not persisted",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			repository.read.mockReturnValue(Effect.succeed(42));
			const store = yield* storeIn(scope);
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				0,
				false,
			);

			expect(readA().value).toBe(0);
			expect(repository.read).not.toHaveBeenCalled();
			expect(repository.write).not.toHaveBeenCalled();
		}),
	);

	testStubbed(
		"fails when the stored value is invalid",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			repository.read.mockReturnValue(Effect.succeed("stored"));
			const invalid = FieldDecodeError.make({
				fieldName: "a",
				value: "stored",
				cause: new Error("Expected a number"),
			});
			const validate = vi.fn(() => invalid);
			const store = yield* storeIn(scope);
			const error = yield* store
				.initializeReplicant("ns", "a", validate, 0, true)
				.pipe(Effect.flip);

			expect(validate).toHaveBeenCalledWith("stored");
			expect(error).toEqual(
				ReplicantLoadError.make({ namespace: "ns", name: "a", cause: invalid }),
			);
			const commitError = yield* store
				.commit("ns", "a", () => Effect.succeed(1))
				.pipe(Effect.flip);
			expect(commitError).toMatchObject({ _tag: "UnknownReplicant" });
			expect(repository.write).not.toHaveBeenCalled();
		}),
	);

	testStubbed(
		"does not validate the default value",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			const validate = vi.fn(Effect.succeed<Schema.Json>);
			const store = yield* storeIn(scope);
			yield* store.initializeReplicant("ns", "a", validate, 0, true);

			expect(validate).not.toHaveBeenCalled();
		}),
	);

	testStubbed(
		"fails when writing the default value fails",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			repository.write.mockReturnValue(
				BackendError.make({ cause: new Error("disk full") }),
			);
			const store = yield* storeIn(scope);
			const error = yield* store
				.initializeReplicant("ns", "a", Effect.succeed, 0, true)
				.pipe(Effect.flip);

			assert(Schema.is(ReplicantLoadError)(error));
			expect(error).toMatchObject({ namespace: "ns", name: "a" });
			assert(Schema.is(BackendError)(error.cause));
		}),
	);

	testStubbed(
		"fails without overwriting a stored value that does not decode",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			repository.read.mockReturnValue(
				DecodeError.make({ issue: "Expected a valid JSON string" }),
			);
			const store = yield* storeIn(scope);
			const error = yield* store
				.initializeReplicant("ns", "a", Effect.succeed, 0, true)
				.pipe(Effect.flip);

			assert(Schema.is(ReplicantLoadError)(error));
			expect(error).toMatchObject({ namespace: "ns", name: "a" });
			assert(Schema.is(DecodeError)(error.cause));
			expect(repository.write).not.toHaveBeenCalled();
		}),
	);

	testStubbed(
		"fails a duplicate registration as already registered",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			repository.read.mockReturnValue(Effect.succeed(42));
			const store = yield* storeIn(scope);
			yield* store.initializeReplicant("ns", "a", Effect.succeed, 0, true);
			const invalid = FieldDecodeError.make({
				fieldName: "a",
				value: 42,
				cause: new Error("Expected a string"),
			});
			const error = yield* store
				.initializeReplicant("ns", "a", () => invalid, "", true)
				.pipe(Effect.flip);

			expect(error).toEqual(
				ReplicantAlreadyRegistered.make({ namespace: "ns", name: "a" }),
			);
		}),
	);

	testStubbed(
		"does not read storage for a duplicate registration",
		Effect.gen(function* () {
			const scope = yield* Scope.make();
			const store = yield* storeIn(scope);
			yield* store.initializeReplicant("ns", "a", Effect.succeed, 0, true);
			yield* store
				.initializeReplicant("ns", "a", Effect.succeed, 0, true)
				.pipe(Effect.flip);

			expect(repository.read).toHaveBeenCalledTimes(1);
		}),
	);
});

describe("computed", () => {
	test(
		"dies when a computed is initialized twice",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			yield* store.initializeComputed("ns", "c", () => Result.succeed("first"));
			const exit = yield* store
				.initializeComputed("ns", "c", () => Result.succeed("second"))
				.pipe(Effect.exit);
			assert(Exit.isFailure(exit));
			expect(Cause.pretty(exit.cause)).toContain("already registered");
		}),
	);

	test(
		"never computes until read or subscribed",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			let evaluations = 0;
			const readC = yield* store.initializeComputed("ns", "c", () => {
				evaluations += 1;
				return Result.succeed(1);
			});
			expect(evaluations).toBe(0);
			readC();
			expect(evaluations).toBe(1);
		}),
	);

	test(
		"a self-reading computed fails to compute",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readC: () => ComputedResult = yield* store.initializeComputed(
				"ns",
				"c",
				() => readC(),
			);
			const result = readC();
			assert(Result.isFailure(result));
			expect(result.failure.message).toBe(
				'Computing computed field "c" in "ns" failed: Cycle detected',
			);
		}),
	);
});

describe("subscribeComputed", () => {
	test(
		"seeds immediately and dedupes on the encoded key",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				12,
				true,
			);
			yield* store.initializeComputed("ns", "tens", () => {
				const { value } = readA();
				return Result.succeed({
					tens: typeof value === "number" ? Math.floor(value / 10) : 0,
				});
			});
			const stream = yield* store.subscribeComputed("ns", "tens");
			const received: Schema.Json[] = [];
			yield* Stream.runForEach(stream, (value) =>
				Effect.sync(() => received.push(value)),
			).pipe(Effect.forkChild);

			yield* waitFor(() => expect(received).toEqual([{ tens: 1 }]));
			yield* store.commit("ns", "a", () => Effect.succeed(15));
			yield* store.commit("ns", "a", () => Effect.succeed(27));
			yield* waitFor(() =>
				expect(received).toEqual([{ tens: 1 }, { tens: 2 }]),
			);
		}),
	);

	test(
		"a failing evaluation is skipped and the stream continues",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				1,
				true,
			);
			yield* store.initializeComputed("ns", "c", () => {
				const { value } = readA();
				if (value === 2) {
					return Result.fail(
						ComputedComputeError.make({
							namespace: "ns",
							name: "c",
							cause: new Error("boom"),
						}),
					);
				}
				return Result.succeed(value);
			});
			const stream = yield* store.subscribeComputed("ns", "c");
			const received: Schema.Json[] = [];
			yield* Stream.runForEach(stream, (value) =>
				Effect.sync(() => received.push(value)),
			).pipe(Effect.forkChild);

			yield* waitFor(() => expect(received).toEqual([1]));
			yield* store.commit("ns", "a", () => Effect.succeed(2));
			yield* store.commit("ns", "a", () => Effect.succeed(3));
			yield* waitFor(() => expect(received).toEqual([1, 3]));
		}),
	);

	test(
		"recovering to the value from before a failure is no change",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				1,
				true,
			);
			yield* store.initializeComputed("ns", "c", () => {
				const { value } = readA();
				if (value === 2) {
					return Result.fail(
						ComputedComputeError.make({
							namespace: "ns",
							name: "c",
							cause: new Error("boom"),
						}),
					);
				}
				return Result.succeed({ value });
			});
			const stream = yield* store.subscribeComputed("ns", "c");
			const received: Schema.Json[] = [];
			yield* Stream.runForEach(stream, (value) =>
				Effect.sync(() => received.push(value)),
			).pipe(Effect.forkChild);

			yield* waitFor(() => expect(received).toEqual([{ value: 1 }]));
			yield* store.commit("ns", "a", () => Effect.succeed(2));
			yield* store.commit("ns", "a", () => Effect.succeed(1));
			yield* store.commit("ns", "a", () => Effect.succeed(2));
			yield* store.commit("ns", "a", () => Effect.succeed(3));
			yield* waitFor(() =>
				expect(received).toEqual([{ value: 1 }, { value: 3 }]),
			);
		}),
	);

	test(
		"fails the subscribe when the current value cannot be produced",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				2,
				true,
			);
			yield* store.initializeComputed("ns", "c", () => {
				const { value } = readA();
				if (value === 2) {
					return Result.fail(
						ComputedComputeError.make({
							namespace: "ns",
							name: "c",
							cause: new Error("boom"),
						}),
					);
				}
				return Result.succeed(value);
			});
			const exit = yield* Effect.scoped(
				store.subscribeComputed("ns", "c"),
			).pipe(Effect.exit);
			assert(Exit.isFailure(exit));
			expect(Cause.pretty(exit.cause)).toContain("boom");
		}),
	);

	test(
		"closing the subscription scope disarms the computed",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const readA = yield* store.initializeReplicant(
				"ns",
				"a",
				Effect.succeed,
				1,
				true,
			);
			let evaluations = 0;
			yield* store.initializeComputed("ns", "c", () => {
				evaluations += 1;
				return Result.succeed(readA().value);
			});
			yield* Effect.scoped(store.subscribeComputed("ns", "c")).pipe(
				Effect.asVoid,
			);
			expect(evaluations).toBe(1);
			yield* store.commit("ns", "a", () => Effect.succeed(2));
			expect(evaluations).toBe(1);
		}),
	);

	test(
		"fails for an unregistered computed",
		Effect.gen(function* () {
			const store = yield* ReplicantStoreService;
			const exit = yield* Effect.scoped(
				store.subscribeComputed("ns", "missing"),
			).pipe(Effect.exit);
			assert(Exit.isFailure(exit));
			expect(Cause.pretty(exit.cause)).toContain("does not exist");
		}),
	);
});
