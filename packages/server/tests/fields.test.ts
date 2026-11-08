import { testLayer } from "@nodecg-private/test-utils";
import { defineNamespace } from "@nodecg/core";
import { Authentication } from "@nodecg/internal";
import { computeTestHash } from "@nodecg/internal/occ";
import { Effect, Layer, Schema } from "effect";
import { HttpBody } from "effect/http";
import { describe, expect } from "vitest";

import { buildNamespace } from "../src/build-namespace.ts";
import { implementNamespace } from "../src/implement-namespace.ts";
import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import { buildClient, loginAdmin, services } from "./setup.ts";

const everyoneReadWrite = {
	read: { everyone: "allow" },
	write: { everyone: "allow" },
} as const;

const manifest = defineNamespace("show", {
	replicant: {
		count: { schema: Schema.Finite, permission: everyoneReadWrite },
		tags: {
			schema: Schema.Array(Schema.String),
			permission: everyoneReadWrite,
		},
		locked: { schema: Schema.Finite },
	},
	computed: {
		doubled: {
			schema: Schema.Finite,
			permission: { read: { everyone: "allow" } },
		},
	},
});

const namespace = implementNamespace(manifest, {
	seedReplicant: { count: () => 42, tags: () => ["a"], locked: () => 0 },
	implementComputed: { doubled: (ctx) => ctx.replicant.count.get() * 2 },
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

const countUrl = "http://x/api/internal/namespaces/show/replicant/count";
const tagsUrl = "http://x/api/internal/namespaces/show/replicant/tags";
const lockedUrl = "http://x/api/internal/namespaces/show/replicant/locked";
const doubledUrl = "http://x/api/internal/namespaces/show/computed/doubled";

const admin = Authentication.make({ issuer: "dev", subject: "admin" });

describe("get", () => {
	test(
		"returns the stored value",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(countUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toBe(42);
		}),
	);

	test(
		"404 when the namespace/name is not registered",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(
				"http://x/api/internal/namespaces/show/replicant/missing",
			);
			expect(res.status).toBe(404);
		}),
	);

	test(
		"returns a computed field's value",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(doubledUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toBe(84);
		}),
	);
});

describe("update", () => {
	test(
		"applies a root replace patch and returns 204",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const putRes = yield* client.put(countUrl, {
				body: yield* HttpBody.json([{ op: "replace", path: "", value: 7 }]),
			});
			expect(putRes.status).toBe(204);

			const getRes = yield* client.get(countUrl);
			expect(yield* getRes.json).toBe(7);
		}),
	);

	test(
		"400 when the payload is not a patch",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const numberRes = yield* client.put(countUrl, {
				body: yield* HttpBody.json(7),
			});
			expect(numberRes.status).toBe(400);
			const emptyRes = yield* client.put(countUrl, {
				body: yield* HttpBody.json([]),
			});
			expect(emptyRes.status).toBe(400);
			const relativeRes = yield* client.put(countUrl, {
				body: yield* HttpBody.json([{ op: "replace", path: "a", value: 7 }]),
			});
			expect(relativeRes.status).toBe(400);

			const getRes = yield* client.get(countUrl);
			expect(yield* getRes.json).toBe(42);
		}),
	);

	test(
		"422 when the patch cannot apply",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.put(tagsUrl, {
				body: yield* HttpBody.json([{ op: "replace", path: "/x", value: "b" }]),
			});
			expect(res.status).toBe(422);
			expect(yield* res.json).toEqual({
				_tag: "PatchNotApplicable",
				path: "/x",
				reason: "InvalidIndex",
			});
		}),
	);

	test(
		"409 with the current value when the patch was made against another value",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.put(countUrl, {
				body: yield* HttpBody.json([
					{ op: "test-hash", path: "", hash: computeTestHash(0) },
					{ op: "replace", path: "", value: 7 },
				]),
			});
			expect(res.status).toBe(409);
			expect(yield* res.json).toEqual({
				_tag: "RevisionConflict",
				value: 42,
				revision: 0,
				reason: "HashMismatch",
			});
		}),
	);

	test(
		"400 when the patched value does not decode",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const putRes = yield* client.put(countUrl, {
				body: yield* HttpBody.json([{ op: "replace", path: "", value: "x" }]),
			});
			expect(putRes.status).toBe(400);

			const getRes = yield* client.get(countUrl);
			expect(yield* getRes.json).toBe(42);
		}),
	);
});

describe("permission enforcement", () => {
	test(
		"403 when the caller may not read",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(lockedUrl);
			expect(res.status).toBe(403);
		}),
	);

	test(
		"403 when the caller may not write",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.put(lockedUrl, {
				body: yield* HttpBody.json([{ op: "replace", path: "", value: 7 }]),
			});
			expect(res.status).toBe(403);
		}),
	);

	test(
		"reads with the caller's identity",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asAdmin = yield* loginAdmin(client, admin);

			const res = yield* asAdmin.get(lockedUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toBe(0);
		}),
	);
});
