import { defineNamespace } from "@nodecg/core";
import { Schema } from "effect";
import { describe, expect, expectTypeOf, test } from "vitest";

import { implementNamespace } from "./implement-namespace.ts";

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
