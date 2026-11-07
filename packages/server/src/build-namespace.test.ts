import { defineNamespace } from "@nodecg-next/core";
import { CurrentIdentity, ServerIdentity } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer, Schema } from "effect";
import { describe, expect, onTestFinished, vi } from "vitest";
import { z } from "zod";

import { BuiltNamespaceRegistry } from "./build-fields.ts";
import { buildNamespace } from "./build-namespace.ts";
import { fieldInternal } from "./field-builders/field-internal-key.ts";
import { implementNamespace } from "./implement-namespace.ts";
import {
	ComputedComputeError,
	ReplicantStoreService,
} from "./replicant-store.ts";
import { InMemoryReplicantRepository } from "./services/repository/replicant/in-memory-replicant-repository.ts";
import { InMemoryTopicBroker } from "./services/topic-broker/in-memory-topic-broker.ts";
import { TopicBrokerService } from "./services/topic-broker/topic-broker.ts";

const server = ServerIdentity.make({});
const identity = Layer.succeed(CurrentIdentity, server);

const test = testLayer(
	Layer.mergeAll(
		InMemoryReplicantRepository,
		InMemoryTopicBroker,
		ReplicantStoreService.layer.pipe(
			Layer.provide(InMemoryReplicantRepository),
		),
		BuiltNamespaceRegistry.layer,
		identity,
	),
);

// Different encoded and decoded
const countManifest = defineNamespace("ns", {
	replicant: { count: { schema: Schema.FiniteFromString } },
});

describe("seeding", () => {
	test(
		"encodes the seed and seeds the store",
		Effect.gen(function* () {
			const { fields } = yield* buildNamespace(
				implementNamespace(countManifest, {
					seedReplicant: { count: () => 42 },
				}),
				{},
			);
			const { value } =
				yield* fields.replicant.count[fieldInternal].getRevisioned();
			expect(value).toEqual("42");
		}),
	);

	test(
		"fails MissingReplicantSeed when a replicant has no seed",
		Effect.gen(function* () {
			const error = yield* buildNamespace(
				implementNamespace(countManifest, {
					// @ts-expect-error a replicant with no seed is a type error; exercising the runtime guard
					seedReplicant: {},
				}),
				{},
			).pipe(Effect.flip);

			expect(error._tag).toBe("MissingReplicantSeed");
			expect(error.message).toContain('"count"');
		}),
	);

	test(
		"fails if encode rejects the seed value",
		Effect.gen(function* () {
			const error = yield* buildNamespace(
				implementNamespace(countManifest, {
					seedReplicant: { count: () => "nope" as unknown as number },
				}),
				{},
			).pipe(Effect.flip);

			expect(error._tag).toBe("FieldEncodeError");
		}),
	);
});

describe("loaded handle", () => {
	const manifest = defineNamespace("ns", {
		replicant: {
			count: { schema: Schema.FiniteFromString },
			title: { schema: z.string().trim() },
		},
		computed: { doubled: { schema: Schema.FiniteFromString } },
		topic: { cheer: { schema: Schema.String } },
		rpc: {
			echo: {
				schema: {
					request: Schema.FiniteFromString,
					response: Schema.FiniteFromString,
				},
				permission: { write: { everyone: "allow" } },
			},
		},
	});

	test(
		"exposes every field op as a plain accessor running as the server",
		Effect.gen(function* () {
			const broker = yield* TopicBrokerService;
			const publish = vi.spyOn(broker, "publish");
			const { handles } = yield* buildNamespace(
				implementNamespace(manifest, {
					seedReplicant: { count: () => 1, title: () => "semi" },
					implementComputed: {
						doubled: (ctx) => ctx.replicant.count.get() * 2,
					},
					implementRpc: { echo: (request) => request * 10 },
				}),
				{},
			);
			const handle = handles.loaded;

			expect(handle.replicant.count.get()).toBe(1);
			yield* Effect.promise(() => handle.replicant.count.set(2));
			expect(handle.replicant.count.get()).toBe(2);
			yield* Effect.promise(() =>
				handle.replicant.count.update((count) => count + 1),
			);
			expect(handle.replicant.count.get()).toBe(3);
			yield* Effect.promise(() => handle.replicant.title.set(" final "));
			expect(handle.replicant.title.get()).toBe("final");
			expect(
				yield* Effect.promise(() => handle.replicant.count.validate(9)),
			).toBe("9");
			expect(handle.computed.doubled.get()).toBe(6);
			yield* Effect.promise(() => handle.topic.cheer.publish("hi"));
			expect(publish).toHaveBeenCalledWith("ns", "cheer", "hi");
			expect(yield* Effect.promise(() => handle.rpc.echo(4))).toBe(40);

			const received: number[] = [];
			const cancel = yield* Effect.promise(() =>
				handle.replicant.count.subscribe((value) => {
					received.push(value);
				}),
			);
			onTestFinished(() => cancel());
			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([3])),
			);
			yield* Effect.promise(() => handle.replicant.count.set(8));
			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([3, 8])),
			);
		}),
	);

	test(
		"a subscription handler awaits a write to another replicant",
		Effect.gen(function* () {
			const { handles } = yield* buildNamespace(
				implementNamespace(manifest, {
					seedReplicant: { count: () => 1, title: () => "semi" },
					implementComputed: {
						doubled: (ctx) => ctx.replicant.count.get() * 2,
					},
					implementRpc: { echo: (request) => request * 10 },
				}),
				{},
			);
			const handle = handles.loaded;

			const titles: string[] = [];
			const cancel = yield* Effect.promise(() =>
				handle.replicant.count.subscribe(async (count) => {
					await handle.replicant.title.set(`count ${count}`);
					titles.push(handle.replicant.title.get());
				}),
			);
			onTestFinished(() => cancel());

			yield* Effect.promise(() => handle.replicant.count.set(2));

			yield* Effect.promise(() =>
				vi.waitFor(() => expect(titles).toEqual(["count 1", "count 2"])),
			);
		}),
	);

	test(
		"a failing get throws the field's error",
		Effect.gen(function* () {
			const { handles } = yield* buildNamespace(
				implementNamespace(manifest, {
					seedReplicant: { count: () => 1, title: () => "semi" },
					implementComputed: {
						doubled: () => {
							throw new Error("boom");
						},
					},
					implementRpc: { echo: (request) => request * 10 },
				}),
				{},
			);

			expect(() => handles.loaded.computed.doubled.get()).toThrow(
				ComputedComputeError.make({
					namespace: "ns",
					name: "doubled",
					cause: new Error("boom"),
				}),
			);
		}),
	);

	test(
		"subscribes to a grandchild's replicant through children",
		Effect.gen(function* () {
			const grandchild = implementNamespace(
				defineNamespace("grandchild", {
					replicant: { value: { schema: Schema.FiniteFromString } },
				}),
				{ seedReplicant: { value: () => 3 } },
			);
			const child = implementNamespace(
				defineNamespace("child", {
					children: { grandchild: grandchild.manifest },
				}),
				{ children: { grandchild } },
			);
			const parent = implementNamespace(
				defineNamespace("parent", { children: { child: child.manifest } }),
				{ children: { child } },
			);
			const grandchildBuilt = yield* buildNamespace(grandchild, {});
			const childBuilt = yield* buildNamespace(child, {
				grandchild: grandchildBuilt.handles,
			});
			const { handles } = yield* buildNamespace(parent, {
				child: childBuilt.handles,
			});
			const field =
				handles.loaded.children.child.children.grandchild.replicant.value;

			const received: number[] = [];
			const cancel = yield* Effect.promise(() =>
				field.subscribe((value) => {
					received.push(value);
				}),
			);
			onTestFinished(() => cancel());
			yield* grandchildBuilt.fields.replicant.value.set(5);

			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([3, 5])),
			);
		}),
	);
});
