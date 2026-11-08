import { testLayer } from "@nodecg-private/test-utils";
import { defineNamespace } from "@nodecg/core";
import { manifestRolesKey } from "@nodecg/internal";
import { Effect, Layer, Schema } from "effect";
import { HttpBody } from "effect/http";
import { describe, expect, vi } from "vitest";

import { buildNamespace } from "../src/build-namespace.ts";
import { implementNamespace } from "../src/implement-namespace.ts";
import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import { InMemoryReplicantRepository } from "../src/services/repository/replicant/in-memory-replicant-repository.ts";
import {
	ReplicantNotFound,
	ReplicantRepositoryService,
} from "../src/services/repository/replicant/replicant-repository.ts";
import { buildClient, services } from "./setup.ts";

const show = implementNamespace(
	defineNamespace("show", {
		replicant: {
			live: {
				schema: Schema.FiniteFromString,
				permission: { write: { everyone: "allow" } },
				persistent: false,
			},
			score: {
				schema: Schema.FiniteFromString,
				permission: { write: { everyone: "allow" } },
			},
		},
	}),
	{ seedReplicant: { live: () => 0, score: () => 0 } },
);

const namespaces = Layer.effect(
	NamespaceRegistryService,
	Effect.gen(function* () {
		const { fields } = yield* buildNamespace(show, {});
		return yield* NamespaceRegistryService.make([
			{
				namespace: "show",
				declaredRoles: new Set(show.manifest[manifestRolesKey].roles.keys()),
				fields,
			},
		]);
	}),
).pipe(Layer.provide(services));

const test = testLayer(
	Layer.mergeAll(services, InMemoryReplicantRepository, namespaces),
);

const replicantUrl = "http://x/api/internal/namespaces/show/replicant";

describe("replicant persistence", () => {
	test(
		"does not store a replicant that is not persisted",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const repository = yield* ReplicantRepositoryService;
			const context = yield* Effect.context();

			const liveRes = yield* client.put(`${replicantUrl}/live`, {
				body: yield* HttpBody.json([{ op: "replace", path: "", value: "7" }]),
			});
			expect(liveRes.status).toBe(204);

			const scoreRes = yield* client.put(`${replicantUrl}/score`, {
				body: yield* HttpBody.json([{ op: "replace", path: "", value: "7" }]),
			});
			expect(scoreRes.status).toBe(204);

			const getRes = yield* client.get(`${replicantUrl}/live`);
			expect(yield* getRes.json).toBe("7");

			yield* Effect.promise(() =>
				vi.waitFor(async () =>
					expect(
						await Effect.runPromiseWith(context)(
							repository.read("show", "score"),
						),
					).toBe("7"),
				),
			);
			expect(
				yield* repository.read("show", "live").pipe(Effect.flip),
			).toStrictEqual(
				ReplicantNotFound.make({ namespace: "show", name: "live" }),
			);
		}),
	);
});
