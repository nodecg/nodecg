import { testLayer } from "@nodecg-private/test-utils";
import {
	Authentication,
	Role,
	RoleAssignmentsDocument,
	RoleName,
	ServiceAccountDocumentEntry,
	ServiceAccountId,
	UserDocumentEntry,
} from "@nodecg/internal";
import { Effect, HashSet, Layer } from "effect";
import { SecureRandom } from "effect/crypto";
import { HttpBody } from "effect/http";
import { describe, expect } from "vitest";

import { NamespaceRegistryService } from "../src/namespace-registry.ts";
import { UserRepositoryService } from "../src/services/repository/user/user-repository.ts";
import {
	buildClient,
	createServiceAccount,
	findUser,
	login,
	loginAdmin,
	services,
} from "./setup.ts";

const producer = Role.make({
	namespace: "show",
	name: RoleName.make("producer"),
});
const viewer = Role.make({
	namespace: "show",
	name: RoleName.make("viewer"),
});
const judge = Role.make({
	namespace: "show",
	name: RoleName.make("judge"),
});

const test = testLayer(
	Layer.merge(
		services,
		NamespaceRegistryService.layer([
			{
				namespace: "show",
				declaredRoles: new Set([producer.name, viewer.name, judge.name]),
				fields: { replicant: {}, computed: {}, topic: {}, rpc: {} },
			},
		]),
	),
);

const exportUrl = "http://x/api/internal/roles/export";
const importUrl = "http://x/api/internal/roles/import";
const usersUrl = "http://x/api/internal/users";
const serviceAccountsUrl = "http://x/api/internal/service-accounts";

const operator = Authentication.make({ issuer: "dev", subject: "operator" });
const other = Authentication.make({ issuer: "dev", subject: "other" });
const root = Authentication.make({ issuer: "dev", subject: "root" });
const admin = Authentication.make({ issuer: "dev", subject: "admin" });
const newcomer = Authentication.make({ issuer: "dev", subject: "newcomer" });

describe("export", () => {
	test(
		"exports user and service account assignments",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);

			// Setup users
			yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);
			yield* asAdmin.post(`${usersUrl}/${operatorId}/roles/grant`, {
				body: yield* HttpBody.json(producer),
			});

			// Setup service accounts
			const { serviceAccountId: scoreboardId } = yield* createServiceAccount(
				asAdmin,
				"scoreboard",
			);
			yield* asAdmin.post(`${serviceAccountsUrl}/${scoreboardId}/roles/grant`, {
				body: yield* HttpBody.json(viewer),
			});
			yield* createServiceAccount(asAdmin, "idle");

			const res = yield* asAdmin.get(exportUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toEqual({
				version: 0,
				assignments: [
					{
						_tag: "user",
						authentication: operator,
						displayName: "operator",
						roles: [producer],
						globalRoles: [],
					},
					{
						_tag: "serviceAccount",
						id: scoreboardId,
						displayName: "scoreboard",
						roles: [viewer],
						globalRoles: [],
					},
				],
			});
		}),
	);

	test(
		"excludes the admin tier from the export",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;
			const asAdmin = yield* loginAdmin(client, admin);

			const { id: adminId } = yield* findUser(admin);
			yield* users.grantRoles(adminId, HashSet.make(producer));

			const res = yield* asAdmin.get(exportUrl);
			expect(yield* res.json).toMatchObject({
				assignments: expect.arrayContaining([
					expect.objectContaining({
						_tag: "user",
						displayName: "admin",
						roles: [producer],
						globalRoles: [],
					}),
				]),
			});
		}),
	);
});

describe("merge", () => {
	test(
		"merge adds roles to the named users and leaves others alone",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);

			yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);
			yield* asAdmin.post(`${usersUrl}/${operatorId}/roles/grant`, {
				body: yield* HttpBody.json(producer),
			});

			yield* login(client, other);
			const { id: otherId } = yield* findUser(other);
			yield* asAdmin.post(`${usersUrl}/${otherId}/roles/grant`, {
				body: yield* HttpBody.json(judge),
			});

			const res = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [
							UserDocumentEntry.make({
								authentication: operator,
								displayName: "operator",
								roles: [viewer],
								globalRoles: [],
							}),
						],
					}),
				}),
			});
			expect(res.status).toBe(204);

			const operatorGrants = yield* findUser(operator);
			expect(operatorGrants.roles).to.have.deep.members([producer, viewer]);

			const otherGrants = yield* findUser(other);
			expect(otherGrants.roles).toStrictEqual([judge]);
		}),
	);

	test(
		"merges repeated items for one user",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);

			yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);
			yield* asAdmin.post(`${usersUrl}/${operatorId}/roles/grant`, {
				body: yield* HttpBody.json(producer),
			});

			const res = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [
							UserDocumentEntry.make({
								authentication: operator,
								displayName: "operator",
								roles: [viewer],
								globalRoles: [],
							}),
							UserDocumentEntry.make({
								authentication: operator,
								displayName: "operator",
								roles: [judge],
								globalRoles: [],
							}),
						],
					}),
				}),
			});
			expect(res.status).toBe(204);

			const operatorGrants = yield* findUser(operator);
			expect(operatorGrants.roles).to.have.deep.members([
				producer,
				viewer,
				judge,
			]);
		}),
	);

	test(
		"a merge import adds roles to the service account an earlier import created",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const random = yield* SecureRandom.SecureRandom;
			const serviceAccountId = ServiceAccountId.make(yield* random.uuidV7());

			const asAdmin = yield* loginAdmin(client, admin);
			yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [
							ServiceAccountDocumentEntry.make({
								id: serviceAccountId,
								displayName: "Scoreboard",
								roles: [viewer],
								globalRoles: [],
							}),
						],
					}),
				}),
			});

			const importRes = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [
							ServiceAccountDocumentEntry.make({
								id: serviceAccountId,
								displayName: "Renamed",
								roles: [judge],
								globalRoles: [],
							}),
						],
					}),
				}),
			});
			expect(importRes.status).toBe(204);

			const listRes = yield* asAdmin.get(serviceAccountsUrl);
			expect(yield* listRes.json).toMatchObject({
				serviceAccounts: expect.arrayContaining([
					expect.objectContaining({
						id: serviceAccountId,
						displayName: "Scoreboard",
						roles: expect.arrayContaining([viewer, judge]),
					}),
				]),
			});
		}),
	);

	test(
		"merge keeps an admin tier the document does not mention",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;

			yield* login(client, root);
			const { id: rootId } = yield* findUser(root);
			yield* users.grantGlobalRole(rootId, "superadmin");

			const asAdmin = yield* loginAdmin(client, admin);
			const res = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [
							UserDocumentEntry.make({
								authentication: root,
								displayName: "root",
								roles: [viewer],
								globalRoles: [],
							}),
						],
					}),
				}),
			});
			expect(res.status).toBe(204);

			const rootGrants = yield* findUser(root);
			expect(rootGrants.globalRoles).toStrictEqual(["superadmin"]);
		}),
	);
});

describe("replace", () => {
	test(
		"replace overwrites the whole store",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);

			yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);
			yield* asAdmin.post(`${usersUrl}/${operatorId}/roles/grant`, {
				body: yield* HttpBody.json(producer),
			});

			yield* login(client, other);
			const { id: otherId } = yield* findUser(other);
			yield* asAdmin.post(`${usersUrl}/${otherId}/roles/grant`, {
				body: yield* HttpBody.json(judge),
			});

			const res = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "replace",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [
							UserDocumentEntry.make({
								authentication: operator,
								displayName: "operator",
								roles: [viewer],
								globalRoles: [],
							}),
						],
					}),
				}),
			});
			expect(res.status).toBe(204);

			const operatorGrants = yield* findUser(operator);
			expect(operatorGrants.roles).toStrictEqual([viewer]);

			const otherGrants = yield* findUser(other);
			expect(otherGrants.roles).toStrictEqual([]);
		}),
	);

	test(
		"replace clears roles of service accounts absent from the document",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);
			const { serviceAccountId: scoreboardId } = yield* createServiceAccount(
				asAdmin,
				"scoreboard",
			);
			yield* asAdmin.post(`${serviceAccountsUrl}/${scoreboardId}/roles/grant`, {
				body: yield* HttpBody.json(viewer),
			});

			const importRes = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "replace",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [],
					}),
				}),
			});
			expect(importRes.status).toBe(204);

			const listRes = yield* asAdmin.get(serviceAccountsUrl);
			expect(yield* listRes.json).toMatchObject({
				serviceAccounts: expect.arrayContaining([
					expect.objectContaining({ id: scoreboardId, roles: [] }),
				]),
			});
		}),
	);

	test(
		"replace keeps the admin tier of a user absent from the document",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;

			yield* login(client, root);
			const { id: rootId } = yield* findUser(root);
			yield* users.grantGlobalRole(rootId, "superadmin");

			const asAdmin = yield* loginAdmin(client, admin);
			yield* asAdmin.post(`${usersUrl}/${rootId}/roles/grant`, {
				body: yield* HttpBody.json(producer),
			});

			const res = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "replace",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [],
					}),
				}),
			});
			expect(res.status).toBe(204);

			const rootGrants = yield* findUser(root);
			expect(rootGrants.globalRoles).toStrictEqual(["superadmin"]);
		}),
	);
});

describe("account creation", () => {
	test(
		"creates an account for someone who never logged in",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);

			const importRes = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [
							UserDocumentEntry.make({
								authentication: newcomer,
								displayName: "Newcomer",
								roles: [viewer],
								globalRoles: [],
							}),
						],
					}),
				}),
			});
			expect(importRes.status).toBe(204);

			const newcomerGrants = yield* findUser(newcomer);
			expect(newcomerGrants.roles).toStrictEqual([viewer]);
		}),
	);

	test(
		"creates a service account for an unknown id and merges repeated items",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const random = yield* SecureRandom.SecureRandom;
			const serviceAccountId = ServiceAccountId.make(yield* random.uuidV7());

			const asAdmin = yield* loginAdmin(client, admin);
			const importRes = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [
							ServiceAccountDocumentEntry.make({
								id: serviceAccountId,
								displayName: "Scoreboard",
								roles: [viewer],
								globalRoles: [],
							}),
							ServiceAccountDocumentEntry.make({
								id: serviceAccountId,
								displayName: "Scoreboard",
								roles: [judge],
								globalRoles: [],
							}),
						],
					}),
				}),
			});
			expect(importRes.status).toBe(204);

			const listRes = yield* asAdmin.get(serviceAccountsUrl);
			expect(yield* listRes.json).toMatchObject({
				serviceAccounts: expect.arrayContaining([
					expect.objectContaining({
						id: serviceAccountId,
						displayName: "Scoreboard",
						roles: expect.arrayContaining([viewer, judge]),
					}),
				]),
			});
		}),
	);
});

describe("permission", () => {
	test(
		"401 for an anonymous caller",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const importRes = yield* client.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [],
					}),
				}),
			});
			expect(importRes.status).toBe(401);

			const exportRes = yield* client.get(exportUrl);
			expect(exportRes.status).toBe(401);
		}),
	);

	test(
		"403 for a named-role caller without the admin tier",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;
			const asOperator = yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);
			yield* users.grantRoles(operatorId, HashSet.make(producer));

			const importRes = yield* asOperator.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: RoleAssignmentsDocument.make({
						version: 0,
						assignments: [],
					}),
				}),
			});
			expect(importRes.status).toBe(403);

			const exportRes = yield* asOperator.get(exportUrl);
			expect(exportRes.status).toBe(403);
		}),
	);
});

describe("validation", () => {
	test(
		"400 for an admin-tier global role on an entry",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);

			const res = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: {
						version: 0,
						assignments: [
							{
								_tag: "user",
								authentication: operator,
								displayName: "operator",
								roles: [],
								globalRoles: ["superadmin"],
							},
						],
					},
				}),
			});
			expect(res.status).toBe(400);
		}),
	);

	test(
		"400 for an undeclarable role on an entry",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);

			const res = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: {
						version: 0,
						assignments: [
							{
								_tag: "user",
								authentication: operator,
								displayName: "operator",
								roles: [{ namespace: "show", name: "server" }],
								globalRoles: [],
							},
						],
					},
				}),
			});
			expect(res.status).toBe(400);
		}),
	);

	test(
		"400 for a service account id that is not a UUID",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asAdmin = yield* loginAdmin(client, admin);

			const res = yield* asAdmin.post(importUrl, {
				body: yield* HttpBody.json({
					mode: "merge",
					document: {
						version: 0,
						assignments: [
							{
								_tag: "serviceAccount",
								id: "ghost",
								displayName: "Ghost",
								roles: [viewer],
								globalRoles: [],
							},
						],
					},
				}),
			});
			expect(res.status).toBe(400);
		}),
	);
});
