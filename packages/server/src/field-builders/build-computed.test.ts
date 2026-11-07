import { defineNamespace } from "@nodecg-next/core";
import {
	AnonymousIdentitySchema,
	CurrentIdentity,
	ServerIdentity,
} from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer, Option, Result, Schema, Stream } from "effect";
import { assert, describe, expect, vi } from "vitest";

import {
	ComputedComputeError,
	ReplicantStoreService,
} from "../replicant-store.ts";
import { InMemoryReplicantRepository } from "../services/repository/replicant/in-memory-replicant-repository.ts";
import { buildComputed } from "./build-computed.ts";
import { fieldInternal } from "./field-internal-key.ts";

const serverIdentity = Layer.succeed(CurrentIdentity, ServerIdentity.make({}));
const anonymousIdentity = Layer.succeed(
	CurrentIdentity,
	AnonymousIdentitySchema.make({}),
);

const test = testLayer(
	Layer.merge(
		ReplicantStoreService.layer.pipe(
			Layer.provide(InMemoryReplicantRepository),
		),
		serverIdentity,
	),
);

const manifest = defineNamespace("ns", {
	replicant: {
		count: { schema: Schema.FiniteFromString },
	},
	computed: {
		doubled: { schema: Schema.FiniteFromString },
		open: {
			schema: Schema.FiniteFromString,
			permission: { read: { everyone: "allow" } },
		},
		positive: {
			schema: Schema.FiniteFromString.check(Schema.isGreaterThan(0)),
		},
		doc: {
			schema: Schema.Struct({
				count: Schema.FiniteFromString,
				data: Schema.Json,
			}),
		},
	},
});

const doubleCount = (encoded: Schema.Json) => {
	const count = Number(encoded);
	if (Number.isNaN(count)) {
		return Result.fail(
			ComputedComputeError.make({
				namespace: "ns",
				name: "doubled",
				cause: new Error(`not a number: ${JSON.stringify(encoded)}`),
			}),
		);
	}
	return Result.succeed(count * 2);
};

const seedCount = (value: string) =>
	Effect.flatMap(ReplicantStoreService, (store) =>
		store.initializeReplicant("ns", "count", Effect.succeed, value, true),
	);

const setCount = (value: string) =>
	Effect.flatMap(ReplicantStoreService, (store) =>
		store.commit("ns", "count", () => Effect.succeed(value)),
	);

const buildDoubled = (value: string) =>
	Effect.gen(function* () {
		const readCount = yield* seedCount(value);
		return yield* buildComputed(
			"ns",
			"doubled",
			manifest.computed.doubled,
			() => doubleCount(readCount().value),
		);
	});

const waitFor = (assertion: () => void) =>
	Effect.promise(() => vi.waitFor(assertion));

describe("get", () => {
	test(
		"returns the computed value",
		Effect.gen(function* () {
			const field = yield* buildDoubled("3");
			expect(yield* field.get()).toBe(6);
		}),
	);

	test(
		"propagates a compute failure",
		Effect.gen(function* () {
			const field = yield* buildDoubled("boom");
			const error = yield* field.get().pipe(Effect.flip);
			expect(error.message).toBe(
				'Computing computed field "doubled" in "ns" failed: not a number: "boom"',
			);
		}),
	);

	test(
		"fails FieldPermissionDenied for a denied caller",
		Effect.gen(function* () {
			const field = yield* buildDoubled("3");
			const error = yield* field
				.get()
				.pipe(Effect.provide(anonymousIdentity), Effect.flip);
			expect(error._tag).toBe("FieldPermissionDenied");
		}),
	);

	test(
		"returns a value that shares nothing with the store",
		Effect.gen(function* () {
			const field = yield* buildComputed(
				"ns",
				"doc",
				manifest.computed.doc,
				() => Result.succeed({ count: 1, data: { tags: ["a"] } }),
			);

			const first = yield* field.get();
			const second = yield* field.get();

			expect(first.data).not.toBe(second.data);
		}),
	);

	test(
		"keeps no reference to the value the compute returns",
		Effect.gen(function* () {
			const tags = ["a"];
			const field = yield* buildComputed(
				"ns",
				"doc",
				manifest.computed.doc,
				() => Result.succeed({ count: 1, data: { tags } }),
			);

			yield* field.get();
			tags.push("b");

			const doc = yield* field.get();
			expect(doc).toEqual({ count: 1, data: { tags: ["a"] } });
		}),
	);
});

describe("getEncoded", () => {
	test(
		"encodes the computed value for an allowed caller",
		Effect.gen(function* () {
			const readCount = yield* seedCount("3");
			const field = yield* buildComputed(
				"ns",
				"open",
				manifest.computed.open,
				() => doubleCount(readCount().value),
			);
			expect(
				yield* field[fieldInternal]
					.getEncoded()
					.pipe(Effect.provide(anonymousIdentity)),
			).toBe("6");
		}),
	);

	test(
		"fails FieldPermissionDenied for a denied caller",
		Effect.gen(function* () {
			const field = yield* buildDoubled("3");
			const error = yield* field[fieldInternal]
				.getEncoded()
				.pipe(Effect.provide(anonymousIdentity), Effect.flip);
			expect(error._tag).toBe("FieldPermissionDenied");
		}),
	);

	test(
		"fails FieldEncodeError when the computed value fails its schema",
		Effect.gen(function* () {
			const field = yield* buildComputed(
				"ns",
				"positive",
				manifest.computed.positive,
				() => Result.succeed(-1),
			);
			const error = yield* field[fieldInternal]
				.getEncodedNoAuth()
				.pipe(Effect.flip);
			expect(error._tag).toBe("FieldEncodeError");
		}),
	);
});

describe("subscribe", () => {
	test(
		"seeds with the current value, recomputes on a source change, and dedupes",
		Effect.gen(function* () {
			const field = yield* buildDoubled("3");

			const received: number[] = [];
			yield* field.subscribe().pipe(
				Effect.flatMap((stream) =>
					Stream.runForEach(stream, (value) =>
						Effect.sync(() => received.push(value)),
					),
				),
				Effect.forkChild,
			);

			yield* waitFor(() => expect(received).toEqual([6]));
			yield* setCount("5");
			yield* waitFor(() => expect(received).toEqual([6, 10]));
			yield* setCount("5");
			yield* setCount("7");
			yield* waitFor(() => expect(received).toEqual([6, 10, 14]));
		}),
	);

	test(
		"logs and skips a compute failure without ending the stream",
		Effect.gen(function* () {
			const field = yield* buildDoubled("3");

			const received: number[] = [];
			yield* field.subscribe().pipe(
				Effect.flatMap((stream) =>
					Stream.runForEach(stream, (value) =>
						Effect.sync(() => received.push(value)),
					),
				),
				Effect.forkChild,
			);

			yield* waitFor(() => expect(received).toEqual([6]));
			yield* setCount("boom");
			yield* setCount("5");
			yield* waitFor(() => expect(received).toEqual([6, 10]));
		}),
	);

	test(
		"fails when the seed cannot be computed",
		Effect.gen(function* () {
			const field = yield* buildDoubled("boom");
			const error = yield* field.subscribe().pipe(Effect.flip);
			expect(error._tag).toBe("ComputedComputeError");
		}),
	);

	test(
		"emits values that share nothing with the store",
		Effect.gen(function* () {
			const field = yield* buildComputed(
				"ns",
				"doc",
				manifest.computed.doc,
				() => Result.succeed({ count: 1, data: { tags: ["a"] } }),
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
});
