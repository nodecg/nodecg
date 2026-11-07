import { Authentication, UserId } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { ConfigProvider, Effect, HashMap, Layer } from "effect";
import { SecureRandom } from "effect/crypto";
import { HttpBody } from "effect/http";
import { describe, expect } from "vitest";

import {
	type AuthProvider,
	AuthProviderRegistry,
} from "../src/auth/auth-provider.ts";
import { UserRepositoryService } from "../src/services/repository/user/user-repository.ts";
import { buildClient, findUser, login, services } from "./setup.ts";

const test = testLayer(services);

const dev: AuthProvider = {
	name: "dev",
	issuer: "dev",
	authorize: () => Effect.die("unused"),
	callback: () => Effect.die("unused"),
};

const rootInConfig = Layer.mergeAll(
	Layer.succeed(AuthProviderRegistry, HashMap.make(["dev", dev])),
	ConfigProvider.layer(
		ConfigProvider.fromEnvRecord({ SUPERADMINS: "dev:root" }),
	),
);

const usersUrl = "http://x/api/internal/users";
const claimUrl = "http://x/api/internal/authentication/claim-superadmin";

const operator = Authentication.make({ issuer: "dev", subject: "operator" });
const root = Authentication.make({ issuer: "dev", subject: "root" });
const admin = Authentication.make({ issuer: "dev", subject: "admin" });

describe("user", () => {
	for (const name of ["admin", "superadmin"]) {
		test(
			`superadmin grants and revokes ${name}`,
			Effect.gen(function* () {
				const client = yield* buildClient;

				yield* login(client, operator);
				const { id: operatorId } = yield* findUser(operator);

				const asRoot = yield* login(client, root);

				const grantRes = yield* asRoot.post(
					`${usersUrl}/${operatorId}/admin-roles/grant`,
					{ body: yield* HttpBody.json({ name }) },
				);
				expect(grantRes.status).toBe(204);

				expect(yield* findUser(operator)).toMatchObject({
					globalRoles: [name],
				});

				const revokeRes = yield* asRoot.post(
					`${usersUrl}/${operatorId}/admin-roles/revoke`,
					{ body: yield* HttpBody.json({ name }) },
				);
				expect(revokeRes.status).toBe(204);

				expect(yield* findUser(operator)).toMatchObject({
					globalRoles: [],
				});
			}).pipe(Effect.provide(rootInConfig)),
		);
	}

	test(
		"422 when revoking superadmin from a superadmin in config",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asRoot = yield* login(client, root);
			const { id: rootId } = yield* findUser(root);

			const res = yield* asRoot.post(
				`${usersUrl}/${rootId}/admin-roles/revoke`,
				{ body: yield* HttpBody.json({ name: "superadmin" }) },
			);
			expect(res.status).toBe(422);
			expect(yield* res.json).toMatchObject({
				userId: rootId,
				authentication: root,
				message:
					'Superadmin "dev:root" comes from NODECG_SUPERADMINS and can only be revoked by removing the entry there',
			});
		}).pipe(Effect.provide(rootInConfig)),
	);
});

describe("unknown user", () => {
	test(
		"404 for an unknown user",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const random = yield* SecureRandom.SecureRandom;
			const userId = UserId.make(yield* random.uuidV7());

			const asRoot = yield* login(client, root);

			const grantRes = yield* asRoot.post(
				`${usersUrl}/${userId}/admin-roles/grant`,
				{ body: yield* HttpBody.json({ name: "admin" }) },
			);
			expect(grantRes.status).toBe(404);

			const revokeRes = yield* asRoot.post(
				`${usersUrl}/${userId}/admin-roles/revoke`,
				{ body: yield* HttpBody.json({ name: "admin" }) },
			);
			expect(revokeRes.status).toBe(404);
		}).pipe(Effect.provide(rootInConfig)),
	);
});

describe("superadmin claim", () => {
	test(
		"a wrong token leaves the claim open and the first claim closes it",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asOperator = yield* login(client, operator);

			const wrongTokenRes = yield* asOperator.post(claimUrl, {
				body: yield* HttpBody.json({ token: "wrong-token-of-real-length" }),
			});
			expect(wrongTokenRes.status).toBe(403);

			const claimRes = yield* asOperator.post(claimUrl, {
				body: yield* HttpBody.json({ token: "super-secret-claim-token" }),
			});
			expect(claimRes.status).toBe(204);

			const secondClaimRes = yield* asOperator.post(claimUrl, {
				body: yield* HttpBody.json({ token: "super-secret-claim-token" }),
			});
			expect(secondClaimRes.status).toBe(403);
		}).pipe(
			Effect.provide(
				ConfigProvider.layer(
					ConfigProvider.fromEnvRecord({
						SUPERADMIN_CLAIM_TOKEN: "super-secret-claim-token",
					}),
				),
			),
		),
	);

	test(
		"403 while a superadmin is in config",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asOperator = yield* login(client, operator);

			const res = yield* asOperator.post(claimUrl, {
				body: yield* HttpBody.json({ token: "super-secret-claim-token" }),
			});
			expect(res.status).toBe(403);
		}).pipe(
			Effect.provide(
				Layer.mergeAll(
					Layer.succeed(AuthProviderRegistry, HashMap.make(["dev", dev])),
					ConfigProvider.layer(
						ConfigProvider.fromEnvRecord({
							SUPERADMIN_CLAIM_TOKEN: "super-secret-claim-token",
							SUPERADMINS: "dev:root",
						}),
					),
				),
			),
		),
	);

	test(
		"403 when no claim token is configured",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asOperator = yield* login(client, operator);

			const res = yield* asOperator.post(claimUrl, {
				body: yield* HttpBody.json({ token: "super-secret-claim-token" }),
			});
			expect(res.status).toBe(403);
		}),
	);

	test(
		"revoking the last superadmin reopens the claim",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;

			const asRoot = yield* login(client, root);
			const { id: rootId } = yield* findUser(root);
			yield* users.grantGlobalRole(rootId, "superadmin");

			const claimWhileHeldRes = yield* asRoot.post(claimUrl, {
				body: yield* HttpBody.json({ token: "super-secret-claim-token" }),
			});
			expect(claimWhileHeldRes.status).toBe(403);

			const revokeRes = yield* asRoot.post(
				`${usersUrl}/${rootId}/admin-roles/revoke`,
				{ body: yield* HttpBody.json({ name: "superadmin" }) },
			);
			expect(revokeRes.status).toBe(204);

			const claimAfterRevokeRes = yield* asRoot.post(claimUrl, {
				body: yield* HttpBody.json({ token: "super-secret-claim-token" }),
			});
			expect(claimAfterRevokeRes.status).toBe(204);
		}).pipe(
			Effect.provide(
				ConfigProvider.layer(
					ConfigProvider.fromEnvRecord({
						SUPERADMIN_CLAIM_TOKEN: "super-secret-claim-token",
					}),
				),
			),
		),
	);

	test(
		"429 after too many attempts",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asOperator = yield* login(client, operator);

			for (let attempt = 0; attempt < 5; attempt++) {
				const wrongTokenRes = yield* asOperator.post(claimUrl, {
					body: yield* HttpBody.json({ token: "wrong-token-of-real-length" }),
				});
				expect(wrongTokenRes.status).toBe(403);
			}

			const claimRes = yield* asOperator.post(claimUrl, {
				body: yield* HttpBody.json({ token: "super-secret-claim-token" }),
			});
			expect(claimRes.status).toBe(429);
			expect(yield* claimRes.json).toStrictEqual({
				_tag: "TooManyRequests",
				message: "Too many superadmin claim attempts, try again later",
			});
		}).pipe(
			Effect.provide(
				ConfigProvider.layer(
					ConfigProvider.fromEnvRecord({
						SUPERADMIN_CLAIM_TOKEN: "super-secret-claim-token",
					}),
				),
			),
		),
	);

	test(
		"anonymous attempts do not count toward the limit",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const asOperator = yield* login(client, operator);

			for (let attempt = 0; attempt < 10; attempt++) {
				const anonymousRes = yield* client.post(claimUrl, {
					body: yield* HttpBody.json({ token: "super-secret-claim-token" }),
				});
				expect(anonymousRes.status).toBe(401);
			}

			const claimRes = yield* asOperator.post(claimUrl, {
				body: yield* HttpBody.json({ token: "super-secret-claim-token" }),
			});
			expect(claimRes.status).toBe(204);
		}).pipe(
			Effect.provide(
				ConfigProvider.layer(
					ConfigProvider.fromEnvRecord({
						SUPERADMIN_CLAIM_TOKEN: "super-secret-claim-token",
					}),
				),
			),
		),
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
				`${usersUrl}/${operatorId}/admin-roles/grant`,
				{ body: yield* HttpBody.json({ name: "admin" }) },
			);
			expect(grantRes.status).toBe(401);

			const revokeRes = yield* client.post(
				`${usersUrl}/${operatorId}/admin-roles/revoke`,
				{ body: yield* HttpBody.json({ name: "admin" }) },
			);
			expect(revokeRes.status).toBe(401);
		}),
	);

	test(
		"403 for an admin-tier caller who is not a superadmin",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;

			yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);

			const asAdmin = yield* login(client, admin);
			const { id: adminId } = yield* findUser(admin);
			yield* users.grantGlobalRole(adminId, "admin");

			const grantRes = yield* asAdmin.post(
				`${usersUrl}/${operatorId}/admin-roles/grant`,
				{ body: yield* HttpBody.json({ name: "admin" }) },
			);
			expect(grantRes.status).toBe(403);

			const revokeRes = yield* asAdmin.post(
				`${usersUrl}/${operatorId}/admin-roles/revoke`,
				{ body: yield* HttpBody.json({ name: "admin" }) },
			);
			expect(revokeRes.status).toBe(403);
		}),
	);
});

describe("validation", () => {
	test(
		"400 for a role outside the admin tier",
		Effect.gen(function* () {
			const client = yield* buildClient;

			yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);

			const asRoot = yield* login(client, root);

			const res = yield* asRoot.post(
				`${usersUrl}/${operatorId}/admin-roles/grant`,
				{ body: yield* HttpBody.json({ name: "producer" }) },
			);
			expect(res.status).toBe(400);
		}).pipe(Effect.provide(rootInConfig)),
	);
});
