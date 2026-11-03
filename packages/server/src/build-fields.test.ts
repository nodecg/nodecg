import { defineNamespace } from "@nodecg-next/core";
import {
	CurrentIdentity,
	Authentication,
	User,
	UserId,
	RoleName,
	ServerIdentity,
} from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer, Schema, Stream } from "effect";
import { assert, describe, expect, expectTypeOf, vi } from "vitest";

import {
	BuiltNamespaceRegistry,
	LoadedNamespacesService,
} from "./build-fields.ts";
import { buildNamespace } from "./build-namespace.ts";
import {
	type ComputeContext,
	implementNamespace,
	type RpcContext,
} from "./implement-namespace.ts";
import { ReplicantStoreService } from "./replicant-store.ts";
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

describe("computed source snapshot", () => {
	const manifest = defineNamespace("ns", {
		replicant: {
			games: { schema: Schema.Array(Schema.Struct({ id: Schema.String })) },
		},
		computed: { firstGameId: { schema: Schema.NullOr(Schema.String) } },
	});

	const load = buildNamespace(
		implementNamespace(manifest, {
			seedReplicant: { games: () => [] },
			implementComputed: {
				firstGameId: (ctx) => ctx.replicant.games.get()[0]?.id ?? null,
			},
		}),
	);

	test(
		"get computes from the decoded snapshot of the namespace's replicants",
		Effect.gen(function* () {
			const built = yield* load;

			expect(yield* built.computed.firstGameId.get()).toBe(null);

			yield* built.replicant.games.set([{ id: "a" }, { id: "b" }]);
			expect(yield* built.computed.firstGameId.get()).toBe("a");
		}),
	);

	test(
		"subscribe recomputes when an own replicant changes",
		Effect.gen(function* () {
			const built = yield* load;

			const received: (string | null)[] = [];
			yield* built.computed.firstGameId.subscribe().pipe(
				Effect.flatMap((stream) =>
					Stream.runForEach(stream, (value) =>
						Effect.sync(() => received.push(value)),
					),
				),
				Effect.forkChild,
			);

			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([null])),
			);
			yield* built.replicant.games.set([{ id: "a" }]);
			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([null, "a"])),
			);
		}),
	);
});

describe("compute fn contract", () => {
	const manifest = defineNamespace("ns", {
		replicant: {
			games: { schema: Schema.Array(Schema.Struct({ id: Schema.String })) },
		},
		computed: { firstGameId: { schema: Schema.NullOr(Schema.String) } },
	});

	test(
		"passes a compute context whose replicant view holds the decoded sources",
		Effect.gen(function* () {
			let received:
				| ComputeContext<
						{ readonly games: readonly { readonly id: string }[] },
						{}
				  >
				| undefined;
			const built = yield* buildNamespace(
				implementNamespace(manifest, {
					seedReplicant: { games: () => [{ id: "a" }] },
					implementComputed: {
						firstGameId: (ctx) => {
							// the own key is excluded, leaving no computed siblings here
							expectTypeOf(ctx).toExtend<
								ComputeContext<
									{ readonly games: readonly { readonly id: string }[] },
									{}
								>
							>();
							// @ts-expect-error a computed cannot read itself
							void ctx.computed.firstGameId;
							received = ctx;
							return ctx.replicant.games.get()[0]?.id ?? null;
						},
					},
				}),
			);
			yield* built.computed.firstGameId.get();

			assert(received);
			expect(received.replicant.games.get()).toEqual([{ id: "a" }]);
			expect(received.use).toBeTypeOf("function");
		}),
	);

	test(
		"surfaces a throwing compute fn as ComputedComputeError",
		Effect.gen(function* () {
			const built = yield* buildNamespace(
				implementNamespace(manifest, {
					seedReplicant: { games: () => [] },
					implementComputed: {
						firstGameId: () => {
							throw new Error("boom");
						},
					},
				}),
			);
			const error = yield* built.computed.firstGameId.get().pipe(Effect.flip);
			expect(error._tag).toBe("ComputedComputeError");
			expect(error.message).toContain("boom");
		}),
	);
});

describe("computed-on-computed via ctx.computed", () => {
	const manifest = defineNamespace("chain", {
		replicant: { score: { schema: Schema.FiniteFromString } },
		computed: {
			delta: { schema: Schema.FiniteFromString },
			winning: { schema: Schema.Boolean },
		},
	});

	const load = buildNamespace(
		implementNamespace(manifest, {
			seedReplicant: { score: () => 8 },
			implementComputed: {
				delta: (ctx) => ctx.replicant.score.get() - 10,
				winning: (ctx) => ctx.computed.delta.get() > 0,
			},
		}),
	);

	test(
		"a computed reads another computed of its own namespace",
		Effect.gen(function* () {
			const built = yield* load;

			expect(yield* built.computed.winning.get()).toBe(false);

			yield* built.replicant.score.set(15);
			expect(yield* built.computed.winning.get()).toBe(true);
		}),
	);

	test(
		"subscribe recomputes through the chain and dedupes unchanged values",
		Effect.gen(function* () {
			const built = yield* load;

			const received: boolean[] = [];
			yield* built.computed.winning.subscribe().pipe(
				Effect.flatMap((stream) =>
					Stream.runForEach(stream, (value) =>
						Effect.sync(() => received.push(value)),
					),
				),
				Effect.forkChild,
			);

			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([false])),
			);
			yield* built.replicant.score.set(15);
			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([false, true])),
			);
			// delta changes but winning stays true → no frame
			yield* built.replicant.score.set(16);
			yield* built.replicant.score.set(5);
			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([false, true, false])),
			);
		}),
	);

	test(
		"a computed cycle fails as ComputedComputeError instead of looping",
		Effect.gen(function* () {
			const cyclic = defineNamespace("cyclic", {
				computed: {
					a: { schema: Schema.Finite },
					b: { schema: Schema.Finite },
				},
			});
			const built = yield* buildNamespace(
				implementNamespace(cyclic, {
					implementComputed: {
						a: (ctx) => ctx.computed.b.get() + 1,
						b: (ctx) => ctx.computed.a.get() + 1,
					},
				}),
			);

			const error = yield* built.computed.a.get().pipe(Effect.flip);

			expect(error._tag).toBe("ComputedComputeError");
			expect(error.message).toContain("Cycle detected");
		}),
	);
});

describe("rpc ctx", () => {
	const manifest = defineNamespace("ns", {
		replicant: { count: { schema: Schema.Finite } },
		computed: { doubled: { schema: Schema.Finite } },
		topic: { cheer: { schema: Schema.String } },
		rpc: {
			bump: {
				schema: { request: Schema.Finite, response: Schema.Finite },
				permission: { write: { everyone: "allow" } },
			},
		},
	});

	type Ctx = RpcContext<{
		replicant: { count: number };
		computed: { doubled: number };
		topic: { cheer: string };
		rpc: {};
	}>;

	const load = (
		bump: (request: number, ctx: Ctx) => Promise<number> | number,
	) =>
		buildNamespace(
			implementNamespace(manifest, {
				seedReplicant: { count: () => 0 },
				implementComputed: { doubled: (ctx) => ctx.replicant.count.get() * 2 },
				implementRpc: { bump },
			}),
		);

	test(
		"a handler reads, writes, and publishes its own namespace through ctx",
		Effect.gen(function* () {
			const broker = yield* TopicBrokerService;
			const publish = vi.spyOn(broker, "publish");
			const built = yield* load(async (request, ctx) => {
				await ctx.replicant.count.set(ctx.replicant.count.get() + request);
				await ctx.replicant.count.update((count) => count + 1);
				await ctx.topic.cheer.publish("bumped");
				return ctx.computed.doubled.get();
			});

			const result = yield* built.rpc.bump.call(5);

			expect(yield* built.replicant.count.get()).toBe(6);
			expect(publish).toHaveBeenCalledWith("ns", "cheer", "bumped");
			expect(result).toBe(12);
		}),
	);
});

describe("rpc ctx runs as the server identity", () => {
	const operator = Layer.succeed(
		CurrentIdentity,
		User.make({
			id: UserId.make("operator"),
			authentication: Authentication.make({
				issuer: "test",
				subject: "subject",
			}),
			displayName: "Operator",
			roles: [{ namespace: "guarded", name: RoleName.make("operator") }],
			globalRoles: [],
		}),
	);

	const manifest = defineNamespace("guarded", {
		roles: { operator: { permission: ["rpc-call"] } },
		replicant: {
			hidden: { schema: Schema.FiniteFromString },
		},
		rpc: {
			writeHidden: {
				schema: { request: Schema.Finite, response: Schema.Null },
			},
			readHidden: {
				schema: { request: Schema.Null, response: Schema.Finite },
			},
		},
	});

	const load = buildNamespace(
		implementNamespace(manifest, {
			seedReplicant: { hidden: () => 3 },
			implementRpc: {
				writeHidden: async (value, ctx) => {
					await ctx.replicant.hidden.set(value);
					return null;
				},
				readHidden: (_, ctx) => ctx.replicant.hidden.get(),
			},
		}),
	);

	test(
		"writes a private replicant through ctx even when the calling role could not",
		Effect.gen(function* () {
			const built = yield* load;

			yield* built.rpc.writeHidden.call(7).pipe(Effect.provide(operator));

			expect(yield* built.replicant.hidden.get()).toBe(7);
		}),
	);

	test(
		"reads a private replicant through ctx for a role-holding caller",
		Effect.gen(function* () {
			const built = yield* load;

			expect(
				yield* built.rpc.readHidden.call(null).pipe(Effect.provide(operator)),
			).toBe(3);
		}),
	);
});

const settings = implementNamespace(
	defineNamespace("settings", {
		replicant: { multiplier: { schema: Schema.FiniteFromString } },
	}),
	{ seedReplicant: { multiplier: () => 3 } },
);

describe("cross-namespace computed via ctx.use", () => {
	const scoreboard = implementNamespace(
		defineNamespace("scoreboard", {
			replicant: { total: { schema: Schema.FiniteFromString } },
			computed: { weighted: { schema: Schema.FiniteFromString } },
		}),
		{
			seedReplicant: { total: () => 10 },
			implementComputed: {
				weighted: (ctx) =>
					ctx.replicant.total.get() *
					ctx.use(settings).replicant.multiplier.get(),
			},
		},
	);

	const loadBoth = Effect.gen(function* () {
		const settingsBuilt = yield* buildNamespace(settings);
		const scoreboardBuilt = yield* buildNamespace(scoreboard);
		return { settingsBuilt, scoreboardBuilt };
	});

	test(
		"a computed reads a replicant in another namespace",
		Effect.gen(function* () {
			const { scoreboardBuilt } = yield* loadBoth;

			expect(yield* scoreboardBuilt.computed.weighted.get()).toBe(30);
		}),
	);

	test(
		"recomputes when a source in another namespace changes",
		Effect.gen(function* () {
			const { settingsBuilt, scoreboardBuilt } = yield* loadBoth;

			const received: number[] = [];
			yield* scoreboardBuilt.computed.weighted.subscribe().pipe(
				Effect.flatMap((stream) =>
					Stream.runForEach(stream, (value) =>
						Effect.sync(() => received.push(value)),
					),
				),
				Effect.forkChild,
			);

			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([30])),
			);
			yield* settingsBuilt.replicant.multiplier.set(5);
			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([30, 50])),
			);
		}),
	);

	test(
		"an unloaded target surfaces as ComputedComputeError",
		Effect.gen(function* () {
			const built = yield* buildNamespace(scoreboard);

			const error = yield* built.computed.weighted.get().pipe(Effect.flip);

			expect(error._tag).toBe("ComputedComputeError");
		}),
	);

	test(
		"a target outside the loaded set fails NamespaceNotLoaded at the use call",
		Effect.gen(function* () {
			const { scoreboardBuilt } = yield* loadBoth.pipe(
				Effect.provideService(LoadedNamespacesService, new Set(["scoreboard"])),
			);

			const error = yield* scoreboardBuilt.computed.weighted
				.get()
				.pipe(Effect.flip);

			expect(error._tag).toBe("ComputedComputeError");
			expect(error.message).toContain('"settings" was not loaded');
		}),
	);
});

describe("cross-namespace rpc via ctx.use", () => {
	const scoreboard = implementNamespace(
		defineNamespace("scoreboard", {
			replicant: { total: { schema: Schema.FiniteFromString } },
			rpc: {
				award: {
					schema: { request: Schema.Finite, response: Schema.Finite },
					permission: { write: { everyone: "allow" } },
				},
				reset: {
					schema: { request: Schema.Null, response: Schema.Null },
					permission: { write: { everyone: "allow" } },
				},
			},
		}),
		{
			seedReplicant: { total: () => 0 },
			implementRpc: {
				award: async (points, ctx) => {
					const multiplier = ctx.use(settings).replicant.multiplier.get();
					await ctx.replicant.total.update(
						(total) => total + points * multiplier,
					);
					return ctx.replicant.total.get();
				},
				reset: async (_, ctx) => {
					await ctx.use(settings).replicant.multiplier.set(1);
					return null;
				},
			},
		},
	);

	const loadBoth = Effect.gen(function* () {
		const settingsBuilt = yield* buildNamespace(settings);
		const built = yield* buildNamespace(scoreboard);
		return { built, settingsBuilt };
	});

	test(
		"a handler reads another namespace's replicant through ctx.use",
		Effect.gen(function* () {
			const { built } = yield* loadBoth;

			expect(yield* built.rpc.award.call(5)).toBe(15);
			expect(yield* built.replicant.total.get()).toBe(15);
		}),
	);

	test(
		"a handler writes another namespace's replicant through ctx.use",
		Effect.gen(function* () {
			const { built, settingsBuilt } = yield* loadBoth;

			yield* built.rpc.reset.call(null);

			expect(yield* settingsBuilt.replicant.multiplier.get()).toBe(1);
		}),
	);

	test(
		"a handler calls another namespace's rpc through ctx.use",
		Effect.gen(function* () {
			const { built } = yield* loadBoth;
			const relay = implementNamespace(
				defineNamespace("relay", {
					rpc: {
						relayAward: {
							schema: { request: Schema.Finite, response: Schema.Finite },
							permission: { write: { everyone: "allow" } },
						},
					},
				}),
				{
					implementRpc: {
						relayAward: (points, ctx) => ctx.use(scoreboard).rpc.award(points),
					},
				},
			);
			const relayBuilt = yield* buildNamespace(relay);

			const result = yield* relayBuilt.rpc.relayAward.call(2);

			expect(result).toBe(6);
			expect(yield* built.replicant.total.get()).toBe(6);
		}),
	);
});
