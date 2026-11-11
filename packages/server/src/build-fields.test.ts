import { testLayer } from "@nodecg-private/test-utils";
import { defineNamespace } from "@nodecg/core";
import {
	CurrentIdentity,
	Authentication,
	User,
	UserId,
	RoleName,
	ServerIdentity,
} from "@nodecg/internal";
import { Effect, Layer, Schema, Stream } from "effect";
import { assert, describe, expect, expectTypeOf, vi } from "vitest";

import { buildNamespace } from "./build-namespace.ts";
import {
	type ComputeContext,
	implementNamespace,
	type RpcContext,
} from "./implement-namespace.ts";
import {
	ComputedComputeError,
	ComputedCycle,
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
		[manifest.namespace],
		implementNamespace(manifest, {
			seedReplicant: { games: () => [] },
			implementComputed: {
				firstGameId: (ctx) => ctx.replicant.games.get()[0]?.id ?? null,
			},
		}),
		{},
	);

	test(
		"get computes from the decoded snapshot of the namespace's replicants",
		Effect.gen(function* () {
			const { fields } = yield* load;

			expect(yield* fields.computed.firstGameId.get()).toBe(null);

			yield* fields.replicant.games.set([{ id: "a" }, { id: "b" }]);
			expect(yield* fields.computed.firstGameId.get()).toBe("a");
		}),
	);

	test(
		"subscribe recomputes when an own replicant changes",
		Effect.gen(function* () {
			const { fields } = yield* load;

			const received: (string | null)[] = [];
			yield* fields.computed.firstGameId.subscribe().pipe(
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
			yield* fields.replicant.games.set([{ id: "a" }]);
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
						{},
						{}
				  >
				| undefined;
			const { fields } = yield* buildNamespace(
				[manifest.namespace],
				implementNamespace(manifest, {
					seedReplicant: { games: () => [{ id: "a" }] },
					implementComputed: {
						firstGameId: (ctx) => {
							// the own key is excluded, leaving no computed siblings here
							expectTypeOf(ctx).toExtend<
								ComputeContext<
									{ readonly games: readonly { readonly id: string }[] },
									{},
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
				{},
			);
			yield* fields.computed.firstGameId.get();

			assert(received);
			expect(received.replicant.games.get()).toEqual([{ id: "a" }]);
		}),
	);

	test(
		"surfaces a throwing compute fn as ComputedComputeError",
		Effect.gen(function* () {
			const { fields } = yield* buildNamespace(
				[manifest.namespace],
				implementNamespace(manifest, {
					seedReplicant: { games: () => [] },
					implementComputed: {
						firstGameId: () => {
							throw new Error("boom");
						},
					},
				}),
				{},
			);
			const error = yield* fields.computed.firstGameId.get().pipe(Effect.flip);
			expect(error._tag).toBe("ComputedComputeError");
			expect(error.cause).toEqual(new Error("boom"));
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
		[manifest.namespace],
		implementNamespace(manifest, {
			seedReplicant: { score: () => 8 },
			implementComputed: {
				delta: (ctx) => ctx.replicant.score.get() - 10,
				winning: (ctx) => ctx.computed.delta.get() > 0,
			},
		}),
		{},
	);

	test(
		"a computed reads another computed of its own namespace",
		Effect.gen(function* () {
			const { fields } = yield* load;

			expect(yield* fields.computed.winning.get()).toBe(false);

			yield* fields.replicant.score.set(15);
			expect(yield* fields.computed.winning.get()).toBe(true);
		}),
	);

	test(
		"subscribe recomputes through the chain and dedupes unchanged values",
		Effect.gen(function* () {
			const { fields } = yield* load;

			const received: boolean[] = [];
			yield* fields.computed.winning.subscribe().pipe(
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
			yield* fields.replicant.score.set(15);
			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([false, true])),
			);
			// delta changes but winning stays true → no frame
			yield* fields.replicant.score.set(16);
			yield* fields.replicant.score.set(5);
			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([false, true, false])),
			);
		}),
	);

	test(
		"a computed cycle fails as ComputedCycle instead of looping",
		Effect.gen(function* () {
			const cyclic = defineNamespace("cyclic", {
				computed: {
					a: { schema: Schema.Finite },
					b: { schema: Schema.Finite },
				},
			});
			const { fields } = yield* buildNamespace(
				[cyclic.namespace],
				implementNamespace(cyclic, {
					implementComputed: {
						a: (ctx) => ctx.computed.b.get() + 1,
						b: (ctx) => ctx.computed.a.get() + 1,
					},
				}),
				{},
			);

			const error = yield* fields.computed.a.get().pipe(Effect.flip);

			expect(error).toEqual(
				ComputedCycle.make({ namespace: ["cyclic"], name: "a" }),
			);
		}),
	);

	test(
		"fails with the error of the computed it reads",
		Effect.gen(function* () {
			const chained = defineNamespace("chained", {
				computed: {
					outer: { schema: Schema.Finite },
					inner: { schema: Schema.Finite },
				},
			});
			const { fields } = yield* buildNamespace(
				[chained.namespace],
				implementNamespace(chained, {
					implementComputed: {
						outer: (ctx) => ctx.computed.inner.get() + 1,
						inner: () => {
							throw new Error("boom");
						},
					},
				}),
				{},
			);

			const error = yield* fields.computed.outer.get().pipe(Effect.flip);

			expect(error).toEqual(
				ComputedComputeError.make({
					namespace: ["chained"],
					name: "inner",
					cause: new Error("boom"),
				}),
			);
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
		children: {};
	}>;

	const load = (
		bump: (request: number, ctx: Ctx) => Promise<number> | number,
	) =>
		buildNamespace(
			[manifest.namespace],
			implementNamespace(manifest, {
				seedReplicant: { count: () => 0 },
				implementComputed: { doubled: (ctx) => ctx.replicant.count.get() * 2 },
				implementRpc: { bump },
			}),
			{},
		);

	test(
		"a handler reads, writes, and publishes its own namespace through ctx",
		Effect.gen(function* () {
			const broker = yield* TopicBrokerService;
			const publish = vi.spyOn(broker, "publish");
			const { fields } = yield* load(async (request, ctx) => {
				await ctx.replicant.count.set(ctx.replicant.count.get() + request);
				await ctx.replicant.count.update((count) => count + 1);
				await ctx.topic.cheer.publish("bumped");
				return ctx.computed.doubled.get();
			});

			const result = yield* fields.rpc.bump.call(5);

			expect(yield* fields.replicant.count.get()).toBe(6);
			expect(publish).toHaveBeenCalledWith(["ns"], "cheer", "bumped");
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
		[manifest.namespace],
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
		{},
	);

	test(
		"writes a private replicant through ctx even when the calling role could not",
		Effect.gen(function* () {
			const { fields } = yield* load;

			yield* fields.rpc.writeHidden.call(7).pipe(Effect.provide(operator));

			expect(yield* fields.replicant.hidden.get()).toBe(7);
		}),
	);

	test(
		"reads a private replicant through ctx for a role-holding caller",
		Effect.gen(function* () {
			const { fields } = yield* load;

			expect(
				yield* fields.rpc.readHidden.call(null).pipe(Effect.provide(operator)),
			).toBe(3);
		}),
	);
});

const everyoneWrite = { write: { everyone: "allow" } } as const;

const settings = implementNamespace(
	defineNamespace("settings", {
		replicant: { multiplier: { schema: Schema.FiniteFromString } },
	}),
	{ seedReplicant: { multiplier: () => 3 } },
);

const scoreboard = implementNamespace(
	defineNamespace("scoreboard", {
		replicant: { total: { schema: Schema.FiniteFromString } },
		computed: { weighted: { schema: Schema.FiniteFromString } },
		rpc: {
			award: {
				schema: { request: Schema.Finite, response: Schema.Finite },
				permission: everyoneWrite,
			},
			reset: {
				schema: { request: Schema.Null, response: Schema.Null },
				permission: everyoneWrite,
			},
		},
		children: { settings: settings.manifest },
	}),
	{
		seedReplicant: { total: () => 10 },
		implementComputed: {
			weighted: (ctx) => {
				// @ts-expect-error scoreboard declares no child named clock
				void ctx.children.clock;
				return (
					ctx.replicant.total.get() *
					ctx.children.settings.replicant.multiplier.get()
				);
			},
		},
		implementRpc: {
			award: async (points, ctx) => {
				const multiplier = ctx.children.settings.replicant.multiplier.get();
				await ctx.replicant.total.update(
					(total) => total + points * multiplier,
				);
				return ctx.replicant.total.get();
			},
			reset: async (_, ctx) => {
				await ctx.children.settings.replicant.multiplier.set(1);
				return null;
			},
		},
		children: { settings },
	},
);

const league = implementNamespace(
	defineNamespace("league", {
		computed: { multiplier: { schema: Schema.FiniteFromString } },
		rpc: {
			relayAward: {
				schema: { request: Schema.Finite, response: Schema.Finite },
				permission: everyoneWrite,
			},
			readMultiplier: {
				schema: { request: Schema.Null, response: Schema.Finite },
				permission: everyoneWrite,
			},
		},
		children: { scoreboard: scoreboard.manifest },
	}),
	{
		implementComputed: {
			multiplier: (ctx) =>
				ctx.children.scoreboard.children.settings.replicant.multiplier.get(),
		},
		implementRpc: {
			relayAward: (points, ctx) => ctx.children.scoreboard.rpc.award(points),
			readMultiplier: (_, ctx) =>
				ctx.children.scoreboard.children.settings.replicant.multiplier.get(),
		},
		children: { scoreboard },
	},
);

const loadTree = Effect.gen(function* () {
	const root = league.manifest.namespace;
	const settingsBuilt = yield* buildNamespace(
		[root, "scoreboard", "settings"],
		settings,
		{},
	);
	const scoreboardBuilt = yield* buildNamespace(
		[root, "scoreboard"],
		scoreboard,
		{
			settings: settingsBuilt.handles,
		},
	);
	const leagueBuilt = yield* buildNamespace([root], league, {
		scoreboard: scoreboardBuilt.handles,
	});
	return {
		settings: settingsBuilt.fields,
		scoreboard: scoreboardBuilt.fields,
		league: leagueBuilt.fields,
	};
});

describe("ctx.children in a compute fn", () => {
	test(
		"a computed reads a replicant of its child",
		Effect.gen(function* () {
			const tree = yield* loadTree;

			expect(yield* tree.scoreboard.computed.weighted.get()).toBe(30);
		}),
	);

	test(
		"recomputes when a source in its child changes",
		Effect.gen(function* () {
			const tree = yield* loadTree;

			const received: number[] = [];
			yield* tree.scoreboard.computed.weighted.subscribe().pipe(
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
			yield* tree.settings.replicant.multiplier.set(5);
			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([30, 50])),
			);
		}),
	);

	test(
		"a computed reads a replicant of its grandchild",
		Effect.gen(function* () {
			const tree = yield* loadTree;

			expect(yield* tree.league.computed.multiplier.get()).toBe(3);
		}),
	);
});

describe("ctx.children in an rpc handler", () => {
	test(
		"a handler reads its child's replicant",
		Effect.gen(function* () {
			const tree = yield* loadTree;

			expect(yield* tree.scoreboard.rpc.award.call(5)).toBe(25);
			expect(yield* tree.scoreboard.replicant.total.get()).toBe(25);
		}),
	);

	test(
		"a handler writes its child's replicant",
		Effect.gen(function* () {
			const tree = yield* loadTree;

			yield* tree.scoreboard.rpc.reset.call(null);

			expect(yield* tree.settings.replicant.multiplier.get()).toBe(1);
		}),
	);

	test(
		"a handler calls its child's rpc",
		Effect.gen(function* () {
			const tree = yield* loadTree;

			const result = yield* tree.league.rpc.relayAward.call(2);

			expect(result).toBe(16);
			expect(yield* tree.scoreboard.replicant.total.get()).toBe(16);
		}),
	);

	test(
		"a handler reads its grandchild's replicant",
		Effect.gen(function* () {
			const tree = yield* loadTree;

			expect(yield* tree.league.rpc.readMultiplier.call(null)).toBe(3);
		}),
	);
});
