import { testLayer } from "@nodecg-private/test-utils";
import { Authentication, Role, RoleName, UserId } from "@nodecg/internal";
import { Effect, HashSet, Layer } from "effect";
import { SecureRandom } from "effect/crypto";
import { HttpBody } from "effect/http";
import { describe, expect } from "vitest";

import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import { UserRepositoryService } from "../src/services/repository/user/user-repository.ts";
import { buildClient, findUser, login, loginAdmin, services } from "./setup.ts";

const producer = Role.make({
	namespace: "show",
	name: RoleName.make("producer"),
});

const test = testLayer(
	Layer.merge(
		services,
		NamespaceRegistryService.layer([
			{
				namespace: "show",
				declaredRoles: new Set([producer.name]),
				fields: { replicant: {}, computed: {}, topic: {}, rpc: {} },
			},
		]),
	),
);

const usersUrl = "http://x/api/internal/users";

const operator = Authentication.make({ issuer: "dev", subject: "operator" });
const admin = Authentication.make({ issuer: "dev", subject: "admin" });

describe("user", () => {
	test(
		"admin grants and revokes a role",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);

			yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);

			const grantRes = yield* asAdmin.post(
				`${usersUrl}/${operatorId}/roles/grant`,
				{ body: yield* HttpBody.json(producer) },
			);
			expect(grantRes.status).toBe(204);

			expect(yield* findUser(operator)).toMatchObject({
				roles: [producer],
			});

			const revokeRes = yield* asAdmin.post(
				`${usersUrl}/${operatorId}/roles/revoke`,
				{ body: yield* HttpBody.json(producer) },
			);
			expect(revokeRes.status).toBe(204);

			expect(yield* findUser(operator)).toMatchObject({
				roles: [],
			});
		}),
	);
});

describe("unknown user", () => {
	test(
		"404 for an unknown user",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const random = yield* SecureRandom.SecureRandom;
			const userId = UserId.make(yield* random.uuidV7());

			const asAdmin = yield* loginAdmin(client, admin);

			yield* login(client, operator);

			const grantRes = yield* asAdmin.post(
				`${usersUrl}/${userId}/roles/grant`,
				{ body: yield* HttpBody.json(producer) },
			);
			expect(grantRes.status).toBe(404);

			const revokeRes = yield* asAdmin.post(
				`${usersUrl}/${userId}/roles/revoke`,
				{ body: yield* HttpBody.json(producer) },
			);
			expect(revokeRes.status).toBe(404);
		}),
	);
});

describe("permission", () => {
	test(
		"401 for an anonymous caller",
		Effect.gen(function* () {
			const client = yield* buildClient;

			yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);

			const grantRes = yield* client.post(
				`${usersUrl}/${operatorId}/roles/grant`,
				{ body: yield* HttpBody.json(producer) },
			);
			expect(grantRes.status).toBe(401);

			const revokeRes = yield* client.post(
				`${usersUrl}/${operatorId}/roles/revoke`,
				{ body: yield* HttpBody.json(producer) },
			);
			expect(revokeRes.status).toBe(401);
		}),
	);

	test(
		"403 for a caller below the admin tier",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;

			const asOperator = yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);
			yield* users.grantRoles(operatorId, HashSet.make(producer));

			const grantRes = yield* asOperator.post(
				`${usersUrl}/${operatorId}/roles/grant`,
				{ body: yield* HttpBody.json(producer) },
			);
			expect(grantRes.status).toBe(403);

			const revokeRes = yield* asOperator.post(
				`${usersUrl}/${operatorId}/roles/revoke`,
				{ body: yield* HttpBody.json(producer) },
			);
			expect(revokeRes.status).toBe(403);
		}),
	);
});

describe("validation", () => {
	test(
		"400 for an undeclarable role",
		Effect.gen(function* () {
			const client = yield* buildClient;

			yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);

			const asAdmin = yield* loginAdmin(client, admin);

			for (const name of ["superadmin", "admin", "server"]) {
				const grantRes = yield* asAdmin.post(
					`${usersUrl}/${operatorId}/roles/grant`,
					{ body: yield* HttpBody.json({ namespace: "show", name }) },
				);
				expect(grantRes.status).toBe(400);

				const revokeRes = yield* asAdmin.post(
					`${usersUrl}/${operatorId}/roles/revoke`,
					{ body: yield* HttpBody.json({ namespace: "show", name }) },
				);
				expect(revokeRes.status).toBe(400);
			}
		}),
	);

	test(
		"422 for a role the namespace does not declare",
		Effect.gen(function* () {
			const client = yield* buildClient;

			yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);

			const asAdmin = yield* loginAdmin(client, admin);

			const undeclaredRoleRes = yield* asAdmin.post(
				`${usersUrl}/${operatorId}/roles/grant`,
				{ body: yield* HttpBody.json({ namespace: "show", name: "ghost" }) },
			);
			expect(undeclaredRoleRes.status).toBe(422);

			const unknownNamespaceRes = yield* asAdmin.post(
				`${usersUrl}/${operatorId}/roles/grant`,
				{
					body: yield* HttpBody.json({ namespace: "stage", name: "producer" }),
				},
			);
			expect(unknownNamespaceRes.status).toBe(422);
		}),
	);
});
