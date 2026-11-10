import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import * as NodeServices from "@effect/platform-node/NodeServices";
import { testLayer } from "@nodecg-private/test-utils";
import { defineNamespace } from "@nodecg/core";
import { ConfigProvider, Effect, Layer, Schema } from "effect";
import {
	assert,
	beforeEach,
	describe,
	expect,
	onTestFinished,
	test,
	vi,
} from "vitest";

import { implementNamespace } from "./implement-namespace.ts";
import {
	DuplicateNamespace,
	loadNamespace,
	loadNamespaceEffect,
	UnimplementedChild,
} from "./load-namespace.ts";
import { AuthenticationRepositoryService } from "./services/repository/authentication/authentication-repository.ts";
import { LoginAttemptRepositoryService } from "./services/repository/login-attempt/login-attempt-repository.ts";
import { InMemoryReplicantRepository } from "./services/repository/replicant/in-memory-replicant-repository.ts";
import {
	type ReplicantRepository,
	ReplicantNotFound,
} from "./services/repository/replicant/replicant-repository.ts";
import { RoleRepositoryService } from "./services/repository/role/role-repository.ts";
import { ServiceAccountRepositoryService } from "./services/repository/service-account/service-account-repository.ts";
import { SessionRepositoryService } from "./services/repository/session/session-repository.ts";
import { UserRepositoryService } from "./services/repository/user/user-repository.ts";
import { InMemoryTopicBroker } from "./services/topic-broker/in-memory-topic-broker.ts";
import { TransactionService } from "./services/transaction/transaction.ts";

const testInMemory = testLayer(
	Layer.mergeAll(
		InMemoryReplicantRepository,
		InMemoryTopicBroker,
		Layer.mock(AuthenticationRepositoryService)({}),
		Layer.mock(LoginAttemptRepositoryService)({}),
		Layer.mock(RoleRepositoryService)({}),
		Layer.mock(ServiceAccountRepositoryService)({}),
		Layer.mock(SessionRepositoryService)({}),
		Layer.mock(UserRepositoryService)({}),
		Layer.mock(TransactionService)({}),
		ConfigProvider.layer(ConfigProvider.fromEnvRecord({})),
		NodeServices.layer,
	),
);

const counter = implementNamespace(
	defineNamespace("counter", {
		replicant: { count: { schema: Schema.FiniteFromString } },
		rpc: {
			bump: {
				schema: { request: Schema.Finite, response: Schema.Finite },
				permission: { write: { everyone: "allow" } },
			},
		},
	}),
	{
		seedReplicant: { count: () => 1 },
		implementRpc: {
			bump: async (by, ctx) => {
				await ctx.replicant.count.update((count) => count + by);
				return ctx.replicant.count.get();
			},
		},
	},
);

const settings = implementNamespace(
	defineNamespace("settings", {
		replicant: { multiplier: { schema: Schema.FiniteFromString } },
	}),
	{ seedReplicant: { multiplier: () => 3 } },
);

describe("handle", () => {
	testInMemory(
		"returns a concretely-typed plain handle of the root",
		Effect.gen(function* () {
			const handle = yield* loadNamespaceEffect(counter);

			expect(handle.replicant.count.get()).toBe(1);
			yield* Effect.promise(() => handle.replicant.count.set(5));
			expect(handle.replicant.count.get()).toBe(5);
			expect(yield* Effect.promise(() => handle.rpc.bump(2))).toBe(7);
		}),
	);

	testInMemory(
		"reaches a child through children",
		Effect.gen(function* () {
			const show = implementNamespace(
				defineNamespace("show", { children: { counter: counter.manifest } }),
				{ children: { counter } },
			);

			const handle = yield* loadNamespaceEffect(show);

			expect(handle.children.counter.replicant.count.get()).toBe(1);
			expect(
				yield* Effect.promise(() => handle.children.counter.rpc.bump(2)),
			).toBe(3);
		}),
	);
});

describe("computed validation", () => {
	const manifest = defineNamespace("broken", {
		replicant: { value: { schema: Schema.FiniteFromString } },
		computed: { derived: { schema: Schema.FiniteFromString } },
	});

	testInMemory(
		"fails the load when a compute fn throws",
		Effect.gen(function* () {
			const implemented = implementNamespace(manifest, {
				seedReplicant: { value: () => 0 },
				implementComputed: {
					derived: () => {
						throw new Error("boom");
					},
				},
			});

			const error = yield* loadNamespaceEffect(implemented).pipe(Effect.flip);

			expect(error._tag).toBe("ComputedComputeError");
		}),
	);

	testInMemory(
		"fails the load when a computed value fails its schema",
		Effect.gen(function* () {
			const implemented = implementNamespace(manifest, {
				seedReplicant: { value: () => 0 },
				implementComputed: {
					derived: () => "nope" as unknown as number,
				},
			});

			const error = yield* loadNamespaceEffect(implemented).pipe(Effect.flip);

			expect(error._tag).toBe("FieldEncodeError");
		}),
	);

	testInMemory(
		"validates a computed that reads its child",
		Effect.gen(function* () {
			const scoreboard = implementNamespace(
				defineNamespace("scoreboard", {
					replicant: { total: { schema: Schema.FiniteFromString } },
					computed: { weighted: { schema: Schema.FiniteFromString } },
					children: { settings: settings.manifest },
				}),
				{
					seedReplicant: { total: () => 10 },
					implementComputed: {
						weighted: (ctx) =>
							ctx.replicant.total.get() *
							ctx.children.settings.replicant.multiplier.get(),
					},
					children: { settings },
				},
			);

			const handle = yield* loadNamespaceEffect(scoreboard);

			expect(handle.computed.weighted.get()).toBe(30);
		}),
	);

	testInMemory(
		"fails the load when computed fields form a cycle",
		Effect.gen(function* () {
			const cyclic = implementNamespace(
				defineNamespace("cyclic", {
					computed: {
						a: { schema: Schema.Finite },
						b: { schema: Schema.Finite },
					},
				}),
				{
					implementComputed: {
						a: (ctx) => ctx.computed.b.get() + 1,
						b: (ctx) => ctx.computed.a.get() + 1,
					},
				},
			);

			const error = yield* loadNamespaceEffect(cyclic).pipe(Effect.flip);

			expect(error._tag).toBe("ComputedComputeError");
			expect(error.message).toContain("Cycle detected");
		}),
	);
});

describe("onLoad", () => {
	testInMemory(
		"runs with the handles of its children",
		Effect.gen(function* () {
			const stats = implementNamespace(
				defineNamespace("stats", {
					replicant: { viewers: { schema: Schema.FiniteFromString } },
					children: { settings: settings.manifest },
				}),
				{
					seedReplicant: { viewers: () => 0 },
					children: { settings },
					onLoad: async (ctx) => {
						await ctx.replicant.viewers.set(
							ctx.children.settings.replicant.multiplier.get() * 100,
						);
					},
				},
			);

			const handle = yield* loadNamespaceEffect(stats);

			expect(handle.replicant.viewers.get()).toBe(300);
		}),
	);

	testInMemory(
		"receives the data folder and the namespace path",
		Effect.gen(function* () {
			const dataDir = join(tmpdir(), "nodecg-data");
			const onLoad = vi.fn();
			const child = implementNamespace(defineNamespace("child", {}), {
				onLoad,
			});
			const parent = implementNamespace(
				defineNamespace("parent", { children: { child: child.manifest } }),
				{ children: { child } },
			);

			yield* loadNamespaceEffect(parent).pipe(
				Effect.provide(
					ConfigProvider.layer(
						ConfigProvider.fromEnvRecord({ DATA_DIR: dataDir }),
					),
				),
			);

			expect(onLoad).toHaveBeenCalledWith(
				expect.objectContaining({
					dataDir,
					namespacePath: ["parent", "child"],
				}),
			);
		}),
	);

	testInMemory(
		"subscribes to a child's replicant through children",
		Effect.gen(function* () {
			const received: number[] = [];
			const stats = implementNamespace(
				defineNamespace("stats", {
					children: { settings: settings.manifest },
				}),
				{
					children: { settings },
					onLoad: (ctx) =>
						ctx.children.settings.replicant.multiplier.subscribe((value) => {
							received.push(value);
						}),
				},
			);

			const handle = yield* loadNamespaceEffect(stats);
			yield* Effect.promise(() =>
				handle.children.settings.replicant.multiplier.set(5),
			);

			yield* Effect.promise(() =>
				vi.waitFor(() => expect(received).toEqual([3, 5])),
			);
		}),
	);

	testInMemory(
		"runs the returned cleanup when the load scope closes",
		Effect.gen(function* () {
			const cleanup = vi.fn();
			const stats = implementNamespace(
				defineNamespace("stats", {
					replicant: { viewers: { schema: Schema.FiniteFromString } },
				}),
				{
					seedReplicant: { viewers: () => 0 },
					onLoad: () => cleanup,
				},
			);

			yield* Effect.scoped(loadNamespaceEffect(stats));

			expect(cleanup).toHaveBeenCalledTimes(1);
		}),
	);

	testInMemory(
		"cleans up onLoad in reverse load order",
		Effect.gen(function* () {
			const calls: string[] = [];
			const child = implementNamespace(defineNamespace("child", {}), {
				onLoad: () => {
					calls.push("child:setup");
					return () => {
						calls.push("child:cleanup");
					};
				},
			});
			const parent = implementNamespace(
				defineNamespace("parent", { children: { child: child.manifest } }),
				{
					children: { child },
					onLoad: () => {
						calls.push("parent:setup");
						return () => {
							calls.push("parent:cleanup");
						};
					},
				},
			);

			yield* Effect.scoped(
				Effect.gen(function* () {
					yield* loadNamespaceEffect(parent);
					expect(calls).toEqual(["child:setup", "parent:setup"]);
				}),
			);

			expect(calls).toEqual([
				"child:setup",
				"parent:setup",
				"parent:cleanup",
				"child:cleanup",
			]);
		}),
	);

	testInMemory(
		"a rejecting onLoad fails the whole load as OnLoadError",
		Effect.gen(function* () {
			const stats = implementNamespace(
				defineNamespace("stats", {
					replicant: { viewers: { schema: Schema.FiniteFromString } },
				}),
				{
					seedReplicant: { viewers: () => 0 },
					onLoad: async () => {
						throw new Error("no connection");
					},
				},
			);

			const error = yield* loadNamespaceEffect(stats).pipe(Effect.flip);

			expect(error._tag).toBe("OnLoadError");
			expect(error.message).toContain('"stats"');
			expect(error.message).toContain("no connection");
		}),
	);
});

describe("children", () => {
	const assetsManifest = defineNamespace("assets", {
		replicant: { files: { schema: Schema.FiniteFromString } },
	});

	testInMemory(
		"loads a grandchild reached only through its grandparent",
		Effect.gen(function* () {
			const assets = implementNamespace(assetsManifest, {
				seedReplicant: { files: () => 4 },
			});
			const sponsors = implementNamespace(
				defineNamespace("sponsors", { children: { assets: assetsManifest } }),
				{ children: { assets } },
			);
			const show = implementNamespace(
				defineNamespace("show", {
					replicant: { files: { schema: Schema.FiniteFromString } },
					children: { sponsors: sponsors.manifest },
				}),
				{
					seedReplicant: { files: () => 0 },
					children: { sponsors },
					onLoad: async (ctx) => {
						await ctx.replicant.files.set(
							ctx.children.sponsors.children.assets.replicant.files.get(),
						);
					},
				},
			);

			const handle = yield* loadNamespaceEffect(show);

			expect(handle.replicant.files.get()).toBe(4);
		}),
	);

	testInMemory(
		"loads a child reached from two parents once",
		Effect.gen(function* () {
			const onLoad = vi.fn();
			const assets = implementNamespace(assetsManifest, {
				seedReplicant: { files: () => 4 },
				onLoad,
			});
			const show = implementNamespace(
				defineNamespace("show", { children: { assets: assetsManifest } }),
				{ children: { assets } },
			);
			const stage = implementNamespace(
				defineNamespace("stage", { children: { assets: assetsManifest } }),
				{ children: { assets } },
			);
			const venue = implementNamespace(
				defineNamespace("venue", {
					children: { show: show.manifest, stage: stage.manifest },
				}),
				{ children: { show, stage } },
			);

			const handle = yield* loadNamespaceEffect(venue);
			yield* Effect.promise(() =>
				handle.children.stage.children.assets.replicant.files.set(9),
			);

			expect(onLoad).toHaveBeenCalledTimes(1);
			expect(handle.children.show.children.assets.replicant.files.get()).toBe(
				9,
			);
		}),
	);

	testInMemory(
		"fails when two child objects share a name",
		Effect.gen(function* () {
			const show = implementNamespace(
				defineNamespace("show", { children: { assets: assetsManifest } }),
				{
					children: {
						assets: implementNamespace(assetsManifest, {
							seedReplicant: { files: () => 0 },
						}),
					},
				},
			);
			const stage = implementNamespace(
				defineNamespace("stage", { children: { assets: assetsManifest } }),
				{
					children: {
						assets: implementNamespace(assetsManifest, {
							seedReplicant: { files: () => 0 },
						}),
					},
				},
			);
			const venue = implementNamespace(
				defineNamespace("venue", {
					children: { show: show.manifest, stage: stage.manifest },
				}),
				{ children: { show, stage } },
			);

			const error = yield* loadNamespaceEffect(venue).pipe(Effect.flip);

			expect(error).toStrictEqual(
				DuplicateNamespace.make({ namespace: "assets", clash: "assets" }),
			);
			expect(error.message).toBe('Namespace "assets" was loaded twice');
		}),
	);

	testInMemory(
		"fails when two namespace names differ only in case",
		Effect.gen(function* () {
			const upper = implementNamespace(defineNamespace("Counter", {}), {});
			const venue = implementNamespace(
				defineNamespace("venue", {
					children: { first: counter.manifest, second: upper.manifest },
				}),
				{ children: { first: counter, second: upper } },
			);

			const error = yield* loadNamespaceEffect(venue).pipe(Effect.flip);

			expect(error).toStrictEqual(
				DuplicateNamespace.make({ namespace: "Counter", clash: "counter" }),
			);
			expect(error.message).toBe(
				'Namespace "Counter" differs from "counter" only in case',
			);
		}),
	);

	testInMemory(
		"fails when a child is implemented for another manifest of the same shape",
		Effect.gen(function* () {
			const lookalike = defineNamespace("assets", {
				replicant: { files: { schema: Schema.FiniteFromString } },
			});
			const show = implementNamespace(
				defineNamespace("show", { children: { assets: assetsManifest } }),
				{
					children: {
						assets: implementNamespace(lookalike, {
							seedReplicant: { files: () => 0 },
						}),
					},
				},
			);

			const error = yield* loadNamespaceEffect(show).pipe(Effect.flip);

			expect(error).toStrictEqual(
				UnimplementedChild.make({ namespace: "show", child: "assets" }),
			);
		}),
	);
});

describe("loadNamespace", () => {
	beforeEach(() => {
		const dataDir = mkdtempSync(join(tmpdir(), "nodecg-load-"));
		vi.stubEnv("NODECG_DATA_DIR", dataDir);
		return () => {
			vi.unstubAllEnvs();
			try {
				rmSync(dataDir, { recursive: true });
			} catch (error) {
				// @effect-diagnostics-next-line globalConsole:off
				console.warn(`Could not remove temp data dir ${dataDir}:`, error);
			}
		};
	});

	test("seeds through the injected plain storage", async () => {
		const storage = {
			read: vi.fn<ReplicantRepository["read"]>((namespace, name) =>
				ReplicantNotFound.make({ namespace, name }),
			),
			write: vi.fn<ReplicantRepository["write"]>(() => Effect.void),
		} satisfies ReplicantRepository;

		const handle = await loadNamespace(settings, { storage });

		expect(storage.write).toHaveBeenCalledWith(["settings"], "multiplier", "3");
		expect(handle.replicant.multiplier.get()).toBe(3);
	});

	test("seeds a child under its parent's path and its key", async () => {
		const storage = {
			read: vi.fn<ReplicantRepository["read"]>((namespace, name) =>
				ReplicantNotFound.make({ namespace, name }),
			),
			write: vi.fn<ReplicantRepository["write"]>(() => Effect.void),
		} satisfies ReplicantRepository;
		const child = implementNamespace(
			defineNamespace("child", {
				replicant: { value: { schema: Schema.Finite } },
			}),
			{ seedReplicant: { value: () => 1 } },
		);
		const parent = implementNamespace(
			defineNamespace("parent", { children: { first: child.manifest } }),
			{ children: { first: child } },
		);

		await loadNamespace(parent, { storage });

		expect(storage.write).toHaveBeenCalledExactlyOnceWith(
			["parent", "first"],
			"value",
			1,
		);
	});

	test("exports a failed load before rejecting", async () => {
		const fetch = vi.fn<typeof globalThis.fetch>(
			async () => new Response(null),
		);
		vi.stubGlobal("fetch", fetch);
		onTestFinished(() => {
			vi.unstubAllGlobals();
		});
		vi.stubEnv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://collector:4318");
		const first = implementNamespace(defineNamespace("twin", {}), {});
		const second = implementNamespace(defineNamespace("twin", {}), {});
		const venue = implementNamespace(
			defineNamespace("venue", {
				children: { first: first.manifest, second: second.manifest },
			}),
			{ children: { first, second } },
		);

		await expect(loadNamespace(venue)).rejects.toThrow(
			'Namespace "twin" was loaded twice',
		);

		const traces = fetch.mock.calls.find(
			([input]) => new Request(input).url === "http://collector:4318/v1/traces",
		);
		assert(typeof traces !== "undefined");
		const [, init] = traces;
		assert(init?.body instanceof Uint8Array);
		expect(Buffer.from(init.body).includes("was loaded twice")).toBe(true);
	});

	test("persists a write made after loading returns", async () => {
		const storage = {
			read: vi.fn<ReplicantRepository["read"]>((namespace, name) =>
				ReplicantNotFound.make({ namespace, name }),
			),
			write: vi.fn<ReplicantRepository["write"]>(() => Effect.void),
		} satisfies ReplicantRepository;

		const handle = await loadNamespace(settings, { storage });
		await handle.replicant.multiplier.set(9);

		await vi.waitFor(() =>
			expect(storage.write).toHaveBeenCalledWith(
				["settings"],
				"multiplier",
				"9",
			),
		);
	});
});
