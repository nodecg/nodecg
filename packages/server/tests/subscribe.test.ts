import { testLayer } from "@nodecg-private/test-utils";
import { defineNamespace } from "@nodecg/core";
import { manifestRolesKey } from "@nodecg/internal";
import { Effect, Schema } from "effect";
import { HttpBody } from "effect/http";
import { describe, expect, onTestFinished, vi } from "vitest";

import { buildNamespace } from "../src/build-namespace.ts";
import { implementNamespace } from "../src/implement-namespace.ts";
import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import { buildClient, services } from "./setup.ts";

const show = implementNamespace(
	defineNamespace("show", {
		replicant: {
			score: {
				schema: Schema.FiniteFromString,
				permission: { write: { everyone: "allow" } },
			},
		},
		computed: { doubled: { schema: Schema.FiniteFromString } },
	}),
	{
		seedReplicant: { score: () => 1 },
		implementComputed: {
			doubled: (ctx) => ctx.replicant.score.get() * 2,
		},
	},
);

const loadShow = Effect.gen(function* () {
	const { fields, handles } = yield* buildNamespace(show, {});
	const registry = yield* NamespaceRegistryService.make([
		{
			namespace: "show",
			declaredRoles: new Set(show.manifest[manifestRolesKey].roles.keys()),
			fields,
		},
	]);
	const client = yield* buildClient.pipe(
		Effect.provideService(NamespaceRegistryService, registry),
	);
	return { client, handle: handles.loaded };
});

const test = testLayer(services);

describe("subscribe", () => {
	test(
		"a replicant subscriber gets the old value",
		Effect.gen(function* () {
			const { client, handle } = yield* loadShow;
			const received: Array<[number, number | undefined]> = [];
			const cancel = yield* Effect.promise(() =>
				handle.replicant.score.subscribe((value, oldValue) => {
					received.push([value, oldValue]);
				}),
			);
			onTestFinished(() => cancel());
			const firstBody = yield* HttpBody.json([
				{ op: "replace", path: "", value: "7" },
			]);
			const secondBody = yield* HttpBody.json([
				{ op: "replace", path: "", value: "9" },
			]);

			const firstWriteRes = yield* client.put(
				"http://x/api/internal/namespaces/show/replicant/score",
				{ body: firstBody },
			);
			expect(firstWriteRes.status).toBe(204);
			const secondWriteRes = yield* client.put(
				"http://x/api/internal/namespaces/show/replicant/score",
				{ body: secondBody },
			);
			expect(secondWriteRes.status).toBe(204);

			yield* Effect.promise(() =>
				vi.waitFor(() =>
					expect(received).toEqual([
						[1, undefined],
						[7, 1],
						[9, 7],
					]),
				),
			);
		}),
	);

	test(
		"a computed subscriber gets the old value",
		Effect.gen(function* () {
			const { client, handle } = yield* loadShow;
			const received: Array<[number, number | undefined]> = [];
			const cancel = yield* Effect.promise(() =>
				handle.computed.doubled.subscribe((value, oldValue) => {
					received.push([value, oldValue]);
				}),
			);
			onTestFinished(() => cancel());
			const firstBody = yield* HttpBody.json([
				{ op: "replace", path: "", value: "7" },
			]);
			const secondBody = yield* HttpBody.json([
				{ op: "replace", path: "", value: "9" },
			]);

			const firstWriteRes = yield* client.put(
				"http://x/api/internal/namespaces/show/replicant/score",
				{ body: firstBody },
			);
			expect(firstWriteRes.status).toBe(204);
			const secondWriteRes = yield* client.put(
				"http://x/api/internal/namespaces/show/replicant/score",
				{ body: secondBody },
			);
			expect(secondWriteRes.status).toBe(204);

			yield* Effect.promise(() =>
				vi.waitFor(() =>
					expect(received).toEqual([
						[2, undefined],
						[14, 2],
						[18, 14],
					]),
				),
			);
		}),
	);
});
