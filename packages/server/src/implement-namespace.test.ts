import { defineNamespace, extendNamespace } from "@nodecg-next/core";
import { CurrentIdentity, ServerIdentity } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer, Schema } from "effect";
import { describe, expect, expectTypeOf, test } from "vitest";

import { buildNamespace } from "./build-namespace.ts";
import {
	implementExtendedNamespace,
	implementNamespace,
} from "./implement-namespace.ts";
import { ReplicantStoreService } from "./replicant-store.ts";
import { InMemoryReplicantRepository } from "./services/repository/replicant/in-memory-replicant-repository.ts";
import { InMemoryTopicBroker } from "./services/topic-broker/in-memory-topic-broker.ts";

const testInMemory = testLayer(
	Layer.mergeAll(
		Layer.succeed(CurrentIdentity, ServerIdentity.make({})),
		InMemoryReplicantRepository,
		InMemoryTopicBroker,
		ReplicantStoreService.layer.pipe(
			Layer.provide(InMemoryReplicantRepository),
		),
	),
);

describe("implementNamespace", () => {
	test("bundles the manifest with its impl", () => {
		const manifest = defineNamespace("ns", {
			replicant: { count: { schema: Schema.Finite } },
		});
		const seedReplicant = { count: () => 7 };

		const implemented = implementNamespace(manifest, { seedReplicant });

		expect(implemented.manifest).toBe(manifest);
		expect(implemented.impl).toEqual({ seedReplicant });
	});

	test("requires a handler for each declared custom route", () => {
		const manifest = defineNamespace("ns", {
			customRoute: { webhook: { post: {} } },
		});
		const post = () => new Response("ok");

		const implemented = implementNamespace(manifest, {
			implementCustomRoute: { webhook: { post } },
		});

		expect(implemented.impl?.implementCustomRoute?.webhook.post).toBe(post);
		// @ts-expect-error implementCustomRoute is required
		implementNamespace(manifest, {});
		// @ts-expect-error webhook has no handler
		implementNamespace(manifest, { implementCustomRoute: {} });
		// @ts-expect-error webhook has no post handler
		implementNamespace(manifest, { implementCustomRoute: { webhook: {} } });
	});

	test("takes no impl when there is nothing to implement", () => {
		const manifest = defineNamespace("ns", {
			topic: { goal: { schema: Schema.String } },
		});

		expect(implementNamespace(manifest).impl).toBeUndefined();
	});

	test("bundles onLoad alongside the field impls", () => {
		const manifest = defineNamespace("ns", {
			replicant: { count: { schema: Schema.Finite } },
		});
		const onLoad = () => {};

		const implemented = implementNamespace(manifest, {
			seedReplicant: { count: () => 0 },
			onLoad,
		});

		expect(implemented.impl?.onLoad).toBe(onLoad);
	});

	test("takes onLoad on a fieldless namespace", () => {
		const manifest = defineNamespace("ns", {
			topic: { goal: { schema: Schema.String } },
		});
		const onLoad = () => {};

		expect(implementNamespace(manifest, { onLoad }).impl?.onLoad).toBe(onLoad);
	});

	test("requires the impl of every field group that has fields", () => {
		const replicant = defineNamespace("ns", {
			replicant: { count: { schema: Schema.Finite } },
		});
		const computed = defineNamespace("ns", {
			computed: { total: { schema: Schema.Finite } },
		});
		const rpc = defineNamespace("ns", {
			rpc: {
				bump: { schema: { request: Schema.Finite, response: Schema.Finite } },
			},
		});

		// @ts-expect-error missing seedReplicant
		implementNamespace(replicant, {});
		// @ts-expect-error missing implementComputed
		implementNamespace(computed, {});
		// @ts-expect-error missing implementRpc
		implementNamespace(rpc, {});
	});

	test("refuses the impl of a field group without fields", () => {
		const manifest = defineNamespace("ns", {
			replicant: { count: { schema: Schema.Finite } },
		});

		implementNamespace(manifest, {
			seedReplicant: { count: () => 0 },
			// @ts-expect-error no computed fields to implement
			implementComputed: {},
		});
	});

	test("requires each declared child, implemented for its own manifest", () => {
		const assets = defineNamespace("assets", {
			replicant: { files: { schema: Schema.Finite } },
		});
		const labels = defineNamespace("labels", {
			replicant: { files: { schema: Schema.String } },
		});
		const show = defineNamespace("show", { children: { assets } });

		// @ts-expect-error the child "assets" has no implementation
		implementNamespace(show, {});
		implementNamespace(show, {
			children: {
				// @ts-expect-error implemented for "labels", not "assets"
				assets: implementNamespace(labels, {
					seedReplicant: { files: () => "" },
				}),
			},
		});
	});

	test("types a custom route handler's children from the manifest", () => {
		const settings = implementNamespace(
			defineNamespace("settings", {
				replicant: { label: { schema: Schema.String } },
			}),
			{ seedReplicant: { label: () => "live" } },
		);
		const show = defineNamespace("show", {
			customRoute: { label: { get: {} } },
			children: { settings: settings.manifest },
		});

		implementNamespace(show, {
			children: { settings },
			implementCustomRoute: {
				label: {
					get: (_, ctx) => {
						expectTypeOf(
							ctx.children.settings.replicant.label.get(),
						).toEqualTypeOf<string>();
						// @ts-expect-error show declares no child named clock
						void ctx.children.clock;
						return new Response();
					},
				},
			},
		});
	});
});

describe("implementExtendedNamespace", () => {
	const base = defineNamespace("match", {
		replicant: {
			score: { schema: Schema.Finite },
			label: { schema: Schema.String },
		},
	});
	const baseImplemented = implementNamespace(base, {
		seedReplicant: { score: () => 10, label: () => "m1" },
	});

	test("merges custom routes and lets the supplement replace a handler", () => {
		const routeBase = defineNamespace("match", {
			customRoute: { webhook: { post: {} }, backup: { get: {} } },
		});
		const post = () => new Response("base");
		const get = () => new Response("base");
		const replacement = () => new Response("extended");
		const download = () => new Response("extended");
		const extended = extendNamespace(routeBase, {
			customRoute: { download: { get: {} } },
		});

		const implemented = implementExtendedNamespace(
			extended,
			implementNamespace(routeBase, {
				implementCustomRoute: { webhook: { post }, backup: { get } },
			}),
			{
				implementCustomRoute: {
					backup: { get: replacement },
					download: { get: download },
				},
			},
		);

		expect(implemented.impl?.implementCustomRoute).toStrictEqual({
			webhook: { post },
			backup: { get: replacement },
			download: { get: download },
		});
	});

	test("requires every handler of a route that gains a method", () => {
		const routeBase = defineNamespace("match", {
			customRoute: { asset: { get: {} } },
		});
		const get = () => new Response("base");
		const post = () => new Response("extended");
		const extended = extendNamespace(routeBase, {
			customRoute: { asset: { post: {} } },
		});
		const base = implementNamespace(routeBase, {
			implementCustomRoute: { asset: { get } },
		});

		const implemented = implementExtendedNamespace(extended, base, {
			implementCustomRoute: { asset: { get, post } },
		});

		expect(implemented.impl?.implementCustomRoute).toStrictEqual({
			asset: { get, post },
		});
		// @ts-expect-error asset gained post, so the supplement names the whole route
		implementExtendedNamespace(extended, base, {});
	});

	testInMemory(
		"merges the base impl with the supplement, then builds once",
		Effect.gen(function* () {
			const extended = extendNamespace(base, {
				replicant: { round: { schema: Schema.Finite } },
				computed: { total: { schema: Schema.Finite } },
			});

			const implemented = implementExtendedNamespace(
				extended,
				baseImplemented,
				{
					seedReplicant: { round: () => 3 },
					implementComputed: {
						total: (ctx) =>
							ctx.replicant.score.get() + ctx.replicant.round.get(),
					},
				},
			);

			const { fields } = yield* buildNamespace(implemented, {});

			expect(yield* fields.replicant.score.get()).toBe(10);
			expect(yield* fields.replicant.round.get()).toBe(3);
			expect(yield* fields.computed.total.get()).toBe(13);
		}),
	);

	testInMemory(
		"overrides an impl the base already covers",
		Effect.gen(function* () {
			const extended = extendNamespace(base, {
				replicant: { round: { schema: Schema.Finite } },
			});

			const implemented = implementExtendedNamespace(
				extended,
				baseImplemented,
				{ seedReplicant: { round: () => 3, score: () => 99 } },
			);
			const { fields } = yield* buildNamespace(implemented, {});

			expect(yield* fields.replicant.score.get()).toBe(99);
			expect(yield* fields.replicant.label.get()).toBe("m1");
		}),
	);

	test("merges the base and extension frontend dirs, deduplicated", () => {
		const extended = extendNamespace(base, {
			replicant: { round: { schema: Schema.Finite } },
		});
		const withFrontend = implementNamespace(base, {
			seedReplicant: { score: () => 0, label: () => "" },
			frontend: { dir: ["/base", "/shared"] },
		});

		const inherited = implementExtendedNamespace(extended, withFrontend, {
			seedReplicant: { round: () => 0 },
		});
		const merged = implementExtendedNamespace(extended, withFrontend, {
			seedReplicant: { round: () => 0 },
			frontend: { dir: ["/shared", "/extended"] },
		});

		expect(inherited.impl?.frontend).toEqual({ dir: ["/base", "/shared"] });
		expect(merged.impl?.frontend).toEqual({
			dir: ["/base", "/shared", "/extended"],
		});
	});

	test("carries the base onLoad, and composes both when the supplement adds one", () => {
		const extended = extendNamespace(base, {
			replicant: { round: { schema: Schema.Finite } },
		});
		const baseOnLoad = () => {};
		const extensionOnLoad = () => {};
		const withOnLoad = implementNamespace(base, {
			seedReplicant: { score: () => 0, label: () => "" },
			onLoad: baseOnLoad,
		});

		const inherited = implementExtendedNamespace(extended, withOnLoad, {
			seedReplicant: { round: () => 0 },
		});
		const composed = implementExtendedNamespace(extended, withOnLoad, {
			seedReplicant: { round: () => 0 },
			onLoad: extensionOnLoad,
		});

		expect(inherited.impl?.onLoad).toBe(baseOnLoad);
		expect(composed.impl?.onLoad).not.toBe(baseOnLoad);
		expect(composed.impl?.onLoad).not.toBe(extensionOnLoad);
		expect(composed.impl?.onLoad).toBeTypeOf("function");
	});

	test("requires the impl of every field group with added fields", () => {
		const replicant = extendNamespace(base, {
			replicant: { round: { schema: Schema.Finite } },
		});
		const computed = extendNamespace(base, {
			computed: { total: { schema: Schema.Finite } },
		});
		const rpc = extendNamespace(base, {
			rpc: {
				bump: { schema: { request: Schema.Finite, response: Schema.Finite } },
			},
		});

		// @ts-expect-error missing seedReplicant
		implementExtendedNamespace(replicant, baseImplemented, {});
		// @ts-expect-error missing implementComputed
		implementExtendedNamespace(computed, baseImplemented, {});
		// @ts-expect-error missing implementRpc
		implementExtendedNamespace(rpc, baseImplemented, {});
	});

	test("merges the base and extension children", () => {
		const assetsManifest = defineNamespace("assets", {});
		const mediaManifest = defineNamespace("media", {});
		const showManifest = defineNamespace("show", {
			children: { assets: assetsManifest },
		});
		const assets = implementNamespace(assetsManifest);
		const media = implementNamespace(mediaManifest);
		const show = implementNamespace(showManifest, { children: { assets } });

		const extended = implementExtendedNamespace(
			extendNamespace(showManifest, { children: { media: mediaManifest } }),
			show,
			{ children: { media } },
		);

		expect(extended.impl?.children).toStrictEqual({ assets, media });
	});

	test("requires each child the extension adds", () => {
		const assetsManifest = defineNamespace("assets", {});
		const showManifest = defineNamespace("show", {});
		const show = implementNamespace(showManifest);

		implementExtendedNamespace(
			extendNamespace(showManifest, { children: { assets: assetsManifest } }),
			show,
			// @ts-expect-error the added child "assets" has no implementation
			{},
		);
	});

	testInMemory(
		"omitting impl for a newly-added field is a type error",
		Effect.gen(function* () {
			const extended = extendNamespace(base, {
				replicant: { round: { schema: Schema.Finite } },
			});

			const implemented = implementExtendedNamespace(
				extended,
				baseImplemented,
				{
					// @ts-expect-error missing seedReplicant for the newly-added "round"
					seedReplicant: {},
				},
			);
			const failure = yield* buildNamespace(implemented, {}).pipe(Effect.flip);
			expect(failure.message).toMatch(
				/Missing seed value for replicant "round"/,
			);
		}),
	);
});
