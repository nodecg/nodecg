import { testLayer } from "@nodecg-private/test-utils";
import { Authentication, Role, RoleName } from "@nodecg/internal";
import { ConfigProvider, Effect, HashMap, HashSet, Layer } from "effect";
import { describe, expect } from "vitest";

import {
	type AuthProvider,
	AuthProviderRegistry,
} from "../src/auth/auth-provider.ts";
import { UserRepositoryService } from "../src/services/repository/user/user-repository.ts";
import {
	buildClient,
	createServiceAccount,
	findUser,
	login,
	loginAdmin,
	services,
} from "./setup.ts";

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

const operator = Authentication.make({ issuer: "dev", subject: "operator" });
const root = Authentication.make({ issuer: "dev", subject: "root" });
const admin = Authentication.make({ issuer: "dev", subject: "admin" });

const viewer = Role.make({
	namespace: "show",
	name: RoleName.make("viewer"),
});

describe("list", () => {
	test(
		"lists each user with its account, authentications and roles",
		Effect.gen(function* () {
			const client = yield* buildClient;
			const users = yield* UserRepositoryService;

			yield* login(client, operator);
			const { id: operatorId } = yield* findUser(operator);
			yield* users.grantRoles(operatorId, HashSet.make(viewer));

			const asAdmin = yield* loginAdmin(client, admin);
			const { id: adminId } = yield* findUser(admin);

			const res = yield* asAdmin.get(usersUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toEqual({
				users: expect.arrayContaining([
					{
						id: operatorId,
						displayName: "operator",
						authentications: [operator],
						roles: [viewer],
						globalRoles: [],
					},
					{
						id: adminId,
						displayName: "admin",
						authentications: [admin],
						roles: [],
						globalRoles: ["admin"],
					},
				]),
			});
		}),
	);

	test(
		"shows superadmin for a superadmin from config",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asRoot = yield* login(client, root);
			const { id: rootId } = yield* findUser(root);

			const res = yield* asRoot.get(usersUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toMatchObject({
				users: expect.arrayContaining([
					expect.objectContaining({
						id: rootId,
						globalRoles: ["superadmin"],
					}),
				]),
			});
		}).pipe(Effect.provide(rootInConfig)),
	);

	test(
		"leaves out service accounts",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asAdmin = yield* loginAdmin(client, admin);
			const { id: adminId } = yield* findUser(admin);

			yield* createServiceAccount(asAdmin, "bot");

			const res = yield* asAdmin.get(usersUrl);
			expect(res.status).toBe(200);
			expect(yield* res.json).toEqual({
				users: [expect.objectContaining({ id: adminId })],
			});
		}),
	);
});

describe("permission", () => {
	test(
		"401 for an anonymous caller",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const res = yield* client.get(usersUrl);
			expect(res.status).toBe(401);
		}),
	);

	test(
		"403 for a caller below the admin tier",
		Effect.gen(function* () {
			const client = yield* buildClient;

			const asOperator = yield* login(client, operator);

			const res = yield* asOperator.get(usersUrl);
			expect(res.status).toBe(403);
		}),
	);
});
