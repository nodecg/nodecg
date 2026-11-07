import { defineNamespace } from "@nodecg-next/core";
import {
	Authentication,
	CreateApiKeyResultSchema,
} from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer, Redacted, Schema } from "effect";
import { HttpClientResponse } from "effect/http";
import { describe, expect } from "vitest";

import { buildNamespace } from "../src/build-namespace.ts";
import { implementNamespace } from "../src/implement-namespace.ts";
import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import {
	buildClient,
	createServiceAccount,
	loginAdmin,
	services,
} from "./setup.ts";

const manifest = defineNamespace("show", {
	replicant: {
		count: {
			schema: Schema.FiniteFromString,
			permission: { read: { everyone: "allow" } },
		},
	},
});

const namespace = implementNamespace(manifest, {
	seedReplicant: { count: () => 42 },
});

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

const serviceAccountsUrl = "http://x/api/internal/service-accounts";
const countUrl = "http://x/api/v0/namespaces/show/replicant/count";

const admin = Authentication.make({ issuer: "dev", subject: "admin" });

describe("bearer token", () => {
	test(
		"authenticates a request with a service account's token",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);
			const { token } = yield* createServiceAccount(asAdmin, "scoreboard");

			const res = yield* client.get(countUrl, {
				headers: { authorization: `Bearer ${Redacted.value(token)}` },
			});
			expect(res.status).toBe(200);
			expect(yield* res.json).toBe("42");
		}),
	);

	test(
		"a refreshed token replaces the old one",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);
			const { serviceAccountId, token: oldToken } = yield* createServiceAccount(
				asAdmin,
				"scoreboard",
			);

			const { token: newToken } = yield* asAdmin
				.post(`${serviceAccountsUrl}/${serviceAccountId}/refresh`)
				.pipe(
					Effect.flatMap(
						HttpClientResponse.schemaBodyJson(CreateApiKeyResultSchema),
					),
				);

			const oldTokenRes = yield* client.get(countUrl, {
				headers: { authorization: `Bearer ${Redacted.value(oldToken)}` },
			});
			expect(oldTokenRes.status).toBe(401);
			const newTokenRes = yield* client.get(countUrl, {
				headers: { authorization: `Bearer ${Redacted.value(newToken)}` },
			});
			expect(newTokenRes.status).toBe(200);
		}),
	);

	test(
		"401 for a resource request without a bearer",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(countUrl);
			expect(res.status).toBe(401);
		}),
	);

	test(
		"401 for a resource request with an unknown bearer",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(countUrl, {
				headers: { authorization: "Bearer anything" },
			});
			expect(res.status).toBe(401);
		}),
	);
});
