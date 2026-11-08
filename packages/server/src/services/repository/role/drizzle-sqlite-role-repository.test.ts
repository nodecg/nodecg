import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { testLayer } from "@nodecg-private/test-utils";
import { Role, RoleName } from "@nodecg/internal";
import { Effect, HashSet, Layer } from "effect";
import { Reactivity } from "effect/reactivity";
import { describe, expect } from "vitest";

import { DrizzleSqliteDatabaseService } from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { AuthenticationRepositoryService } from "../authentication/authentication-repository.ts";
import { DrizzleSqliteAuthenticationRepository } from "../authentication/drizzle-sqlite-authentication-repository.ts";
import { DrizzleSqliteUserRepository } from "../user/drizzle-sqlite-user-repository.ts";
import { UserRepositoryService } from "../user/user-repository.ts";
import { DrizzleSqliteRoleRepository } from "./drizzle-sqlite-role-repository.ts";
import { RoleRepositoryService } from "./role-repository.ts";

const test = testLayer(
	Layer.mergeAll(
		DrizzleSqliteRoleRepository,
		DrizzleSqliteUserRepository,
		DrizzleSqliteAuthenticationRepository,
	).pipe(
		Layer.provideMerge(
			Layer.effect(
				DrizzleSqliteDatabaseService,
				DrizzleSqliteDatabaseService.make(":memory:"),
			),
		),
		Layer.provide(
			Layer.mergeAll(
				NodeFileSystem.layer,
				NodePath.layer,
				NodeCrypto.layer,
				Reactivity.layer,
			),
		),
	),
);

const viewer = Role.make({
	namespace: "show",
	name: RoleName.make("viewer"),
});
const producer = Role.make({
	namespace: "show",
	name: RoleName.make("producer"),
});

const createUser = Effect.fn(function* (
	subject: string,
	displayName: string = subject,
) {
	const authentications = yield* AuthenticationRepositoryService;
	const { userId } = yield* authentications.findOrCreateAuthentication(
		{ issuer: "dev", subject },
		displayName,
	);
	return userId;
});

describe("globalRoleExists", () => {
	test(
		"reports whether any account holds the global role",
		Effect.gen(function* () {
			const repository = yield* RoleRepositoryService;
			const users = yield* UserRepositoryService;
			const alice = yield* createUser("alice");
			yield* users.grantGlobalRole(alice, "admin");

			expect(yield* repository.globalRoleExists("admin")).toBe(true);
			expect(yield* repository.globalRoleExists("superadmin")).toBe(false);
		}),
	);
});

describe("listAll", () => {
	test(
		"lists each authentication with its account's name and grants and leaves out accounts without grants",
		Effect.gen(function* () {
			const repository = yield* RoleRepositoryService;
			const users = yield* UserRepositoryService;
			const alice = yield* createUser("alice", "Alice");
			const bob = yield* createUser("bob", "Bob");
			yield* createUser("carol");
			yield* users.grantRoles(alice, HashSet.make(viewer));
			yield* users.grantGlobalRole(bob, "admin");

			const assignments = yield* repository.listAll();
			expect(assignments).toStrictEqual([
				{
					authentication: { issuer: "dev", subject: "alice" },
					displayName: "Alice",
					roles: [viewer],
					globalRoles: [],
				},
				{
					authentication: { issuer: "dev", subject: "bob" },
					displayName: "Bob",
					roles: [],
					globalRoles: ["admin"],
				},
			]);
		}),
	);
});

describe("revokeAllRoles", () => {
	test(
		"deletes every account's roles and keeps their global roles",
		Effect.gen(function* () {
			const repository = yield* RoleRepositoryService;
			const users = yield* UserRepositoryService;
			const alice = yield* createUser("alice");
			const bob = yield* createUser("bob");
			yield* users.grantRoles(alice, HashSet.make(viewer));
			yield* users.grantGlobalRole(alice, "admin");
			yield* users.grantRoles(bob, HashSet.make(producer));

			yield* repository.revokeAllRoles();

			expect(yield* users.listAll()).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: alice,
						roles: [],
						globalRoles: ["admin"],
					}),
					expect.objectContaining({ id: bob, roles: [], globalRoles: [] }),
				]),
			);
		}),
	);
});
