import { Authentication, RoleName } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer } from "effect";
import { SecureRandom } from "effect/crypto";
import { HttpBody } from "effect/http";
import { describe, expect } from "vitest";

import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import {
	buildClient,
	createServiceAccount,
	loginAdmin,
	services,
} from "./setup.ts";

const namespaces = NamespaceRegistryService.layer([
	{
		namespace: "show",
		declaredRoles: new Set([RoleName.make("viewer"), RoleName.make("judge")]),
		fields: { replicant: {}, computed: {}, topic: {}, rpc: {} },
	},
]);

const test = testLayer(Layer.merge(services, namespaces));

const serviceAccountsUrl = "http://x/api/internal/service-accounts";

const admin = Authentication.make({ issuer: "dev", subject: "admin" });

describe("create", () => {
	test(
		"creates a service account and returns its id and token",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);

			const res = yield* asAdmin.post(serviceAccountsUrl, {
				body: yield* HttpBody.json({ displayName: "scoreboard" }),
			});
			expect(res.status).toBe(200);
			expect(yield* res.json).toEqual({
				serviceAccountId: expect.any(String),
				displayName: "scoreboard",
				token: expect.any(String),
			});
		}),
	);
});

describe("list", () => {
	test(
		"lists service accounts without their tokens",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asAdmin = yield* loginAdmin(client, admin);

			const scoreboard = yield* createServiceAccount(asAdmin, "scoreboard");

			const timer = yield* createServiceAccount(asAdmin, "timer");

			const res = yield* asAdmin.get(serviceAccountsUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toEqual({
				serviceAccounts: expect.arrayContaining([
					{
						id: scoreboard.serviceAccountId,
						displayName: "scoreboard",
						roles: [],
						globalRoles: [],
					},
					{
						id: timer.serviceAccountId,
						displayName: "timer",
						roles: [],
						globalRoles: [],
					},
				]),
			});
		}),
	);
});

describe("delete", () => {
	test(
		"deletes a service account and removes it from the list",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);
			const { serviceAccountId } = yield* createServiceAccount(
				asAdmin,
				"scoreboard",
			);

			const deleteRes = yield* asAdmin.del(
				`${serviceAccountsUrl}/${serviceAccountId}`,
			);
			expect(deleteRes.status).toBe(204);

			const listRes = yield* asAdmin.get(serviceAccountsUrl);
			expect(yield* listRes.json).toEqual({ serviceAccounts: [] });
		}),
	);

	test(
		"404 when deleting an unknown id",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const random = yield* SecureRandom.SecureRandom;
			const unknownId = yield* random.uuidV7();
			const asAdmin = yield* loginAdmin(client, admin);

			const res = yield* asAdmin.del(`${serviceAccountsUrl}/${unknownId}`);
			expect(res.status).toBe(404);
		}),
	);
});

// TODO: scope into a specific API key
describe("refresh", () => {
	test(
		"refreshes the token and keeps the id and display name",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);
			const { serviceAccountId } = yield* createServiceAccount(
				asAdmin,
				"scoreboard",
			);

			const res = yield* asAdmin.post(
				`${serviceAccountsUrl}/${serviceAccountId}/refresh`,
			);
			expect(res.status).toBe(200);
			expect(yield* res.json).toEqual({
				serviceAccountId,
				displayName: "scoreboard",
				token: expect.any(String),
			});
		}),
	);

	test(
		"404 when refreshing an unknown id",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const random = yield* SecureRandom.SecureRandom;
			const unknownId = yield* random.uuidV7();
			const asAdmin = yield* loginAdmin(client, admin);

			const res = yield* asAdmin.post(
				`${serviceAccountsUrl}/${unknownId}/refresh`,
			);
			expect(res.status).toBe(404);
		}),
	);
});

describe("grant role", () => {
	test(
		"grants a role to a service account",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);
			const { serviceAccountId } = yield* createServiceAccount(
				asAdmin,
				"scoreboard",
			);

			const grantRes = yield* asAdmin.post(
				`${serviceAccountsUrl}/${serviceAccountId}/roles/grant`,
				{ body: yield* HttpBody.json({ namespace: "show", name: "viewer" }) },
			);
			expect(grantRes.status).toBe(204);

			const listRes = yield* asAdmin.get(serviceAccountsUrl);
			expect(yield* listRes.json).toMatchObject({
				serviceAccounts: expect.arrayContaining([
					expect.objectContaining({
						id: serviceAccountId,
						roles: [{ namespace: "show", name: "viewer" }],
					}),
				]),
			});
		}),
	);

	test(
		"400 when granting an undeclarable role",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);
			const { serviceAccountId } = yield* createServiceAccount(
				asAdmin,
				"scoreboard",
			);

			for (const role of [
				{ namespace: "show", name: "admin" },
				{ namespace: "show", name: "server" },
			]) {
				const res = yield* asAdmin.post(
					`${serviceAccountsUrl}/${serviceAccountId}/roles/grant`,
					{
						body: yield* HttpBody.json(role),
					},
				);
				expect(res.status).toBe(400);
			}
		}),
	);

	test(
		"422 when granting a role the namespace does not declare",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);
			const { serviceAccountId } = yield* createServiceAccount(
				asAdmin,
				"scoreboard",
			);

			for (const role of [
				{ namespace: "show", name: "ghost" },
				{ namespace: "stage", name: "viewer" },
			]) {
				const res = yield* asAdmin.post(
					`${serviceAccountsUrl}/${serviceAccountId}/roles/grant`,
					{
						body: yield* HttpBody.json(role),
					},
				);
				expect(res.status).toBe(422);
			}
		}),
	);

	test(
		"404 when granting a role to an unknown id",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const random = yield* SecureRandom.SecureRandom;
			const unknownId = yield* random.uuidV7();
			const asAdmin = yield* loginAdmin(client, admin);

			const res = yield* asAdmin.post(
				`${serviceAccountsUrl}/${unknownId}/roles/grant`,
				{ body: yield* HttpBody.json({ namespace: "show", name: "viewer" }) },
			);
			expect(res.status).toBe(404);
		}),
	);
});

describe("revoke role", () => {
	test(
		"revokes a role from a service account",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);
			const { serviceAccountId } = yield* createServiceAccount(
				asAdmin,
				"scoreboard",
			);
			yield* asAdmin.post(
				`${serviceAccountsUrl}/${serviceAccountId}/roles/grant`,
				{
					body: yield* HttpBody.json({ namespace: "show", name: "viewer" }),
				},
			);
			yield* asAdmin.post(
				`${serviceAccountsUrl}/${serviceAccountId}/roles/grant`,
				{
					body: yield* HttpBody.json({ namespace: "show", name: "judge" }),
				},
			);

			const revokeRes = yield* asAdmin.post(
				`${serviceAccountsUrl}/${serviceAccountId}/roles/revoke`,
				{ body: yield* HttpBody.json({ namespace: "show", name: "viewer" }) },
			);
			expect(revokeRes.status).toBe(204);

			const listRes = yield* asAdmin.get(serviceAccountsUrl);
			expect(yield* listRes.json).toMatchObject({
				serviceAccounts: expect.arrayContaining([
					expect.objectContaining({
						id: serviceAccountId,
						roles: [{ namespace: "show", name: "judge" }],
					}),
				]),
			});
		}),
	);

	test(
		"404 when revoking a role from an unknown id",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const random = yield* SecureRandom.SecureRandom;
			const unknownId = yield* random.uuidV7();
			const asAdmin = yield* loginAdmin(client, admin);

			const res = yield* asAdmin.post(
				`${serviceAccountsUrl}/${unknownId}/roles/revoke`,
				{ body: yield* HttpBody.json({ namespace: "show", name: "viewer" }) },
			);
			expect(res.status).toBe(404);
		}),
	);

	test(
		"400 when revoking an undeclarable role",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);
			const { serviceAccountId } = yield* createServiceAccount(
				asAdmin,
				"scoreboard",
			);

			for (const name of ["admin", "server"]) {
				const res = yield* asAdmin.post(
					`${serviceAccountsUrl}/${serviceAccountId}/roles/revoke`,
					{ body: yield* HttpBody.json({ namespace: "show", name }) },
				);
				expect(res.status).toBe(400);
			}
		}),
	);
});

describe("permission", () => {
	test(
		"401 for an anonymous caller",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.post(serviceAccountsUrl, {
				body: yield* HttpBody.json({ displayName: "scoreboard" }),
			});
			expect(res.status).toBe(401);
		}),
	);
});
