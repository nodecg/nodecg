import { testLayer } from "@nodecg-private/test-utils";
import { defineNamespace, extendNamespace } from "@nodecg/core";
import { Effect, Layer, Schema } from "effect";
import { HttpBody } from "effect/http";
import { describe, expect } from "vitest";

import { buildNamespace } from "../src/build-namespace.ts";
import {
	implementExtendedNamespace,
	implementNamespace,
} from "../src/implement-namespace.ts";
import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import { buildClient, services } from "./setup.ts";

const everyoneRead = { read: { everyone: "allow" } } as const;

const base = defineNamespace("show", {
	replicant: {
		score: { schema: Schema.FiniteFromString, permission: everyoneRead },
	},
});

const extended = extendNamespace(base, {
	replicant: {
		bonus: { schema: Schema.FiniteFromString, permission: everyoneRead },
	},
	computed: {
		total: { schema: Schema.FiniteFromString, permission: everyoneRead },
	},
	rpc: {
		addBonus: {
			schema: {
				request: Schema.FiniteFromString,
				response: Schema.FiniteFromString,
			},
			permission: { write: { everyone: "allow" } },
		},
	},
});

const namespace = implementExtendedNamespace(
	extended,
	implementNamespace(base, { seedReplicant: { score: () => 4 } }),
	{
		seedReplicant: { bonus: () => 1 },
		implementComputed: {
			total: (ctx) => ctx.replicant.score.get() + ctx.replicant.bonus.get(),
		},
		implementRpc: {
			addBonus: async (points, ctx) => {
				await ctx.replicant.bonus.update((bonus) => bonus + points);
				return ctx.computed.total.get();
			},
		},
	},
);

const namespaces = Layer.effect(
	NamespaceRegistryService,
	Effect.gen(function* () {
		const { fields } = yield* buildNamespace(namespace, {});
		return yield* NamespaceRegistryService.make([
			{ namespace: fields.namespace, declaredRoles: new Set(), fields },
		]);
	}),
).pipe(Layer.provide(services));

const test = testLayer(Layer.merge(services, namespaces));

const addBonusUrl = "http://x/api/internal/namespaces/show/rpc/addBonus";
const bonusUrl = "http://x/api/internal/namespaces/show/replicant/bonus";

describe("extended namespace", () => {
	test(
		"calls an rpc the extension adds",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const addRes = yield* client.post(addBonusUrl, {
				body: yield* HttpBody.json("2"),
			});
			expect(addRes.status).toBe(200);
			expect(yield* addRes.json).toBe("7");

			const bonusRes = yield* client.get(bonusUrl);
			expect(yield* bonusRes.json).toBe("3");
		}),
	);
});
