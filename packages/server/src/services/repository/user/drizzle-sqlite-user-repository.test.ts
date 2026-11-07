import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { Role, RoleName, UserId } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { Array, Effect, HashSet, Layer } from "effect";
import { Reactivity } from "effect/reactivity";
import { describe, expect } from "vitest";

import { DrizzleSqliteDatabaseService } from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { AuthenticationRepositoryService } from "../authentication/authentication-repository.ts";
import { DrizzleSqliteAuthenticationRepository } from "../authentication/drizzle-sqlite-authentication-repository.ts";
import { DrizzleSqliteUserRepository } from "./drizzle-sqlite-user-repository.ts";
import { UnknownUser, UserRepositoryService } from "./user-repository.ts";

const test = testLayer(
	Layer.mergeAll(
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
const otherViewer = Role.make({
	namespace: "other",
	name: RoleName.make("viewer"),
});

const createUser = Effect.fn(function* (subject: string) {
	const authentications = yield* AuthenticationRepositoryService;
	const { userId } = yield* authentications.findOrCreateAuthentication(
		{ issuer: "dev", subject },
		subject,
	);
	return userId;
});

describe("listAll", () => {
	test(
		"lists each user with its account, authentications and roles",
		Effect.gen(function* () {
			const repository = yield* UserRepositoryService;
			const authentications = yield* AuthenticationRepositoryService;

			const alice = yield* authentications.findOrCreateAuthentication(
				{ issuer: "dev", subject: "alice" },
				"Alice",
			);
			yield* repository.grantRoles(alice.userId, HashSet.make(viewer));
			yield* repository.grantGlobalRole(alice.userId, "admin");

			const bob = yield* authentications.findOrCreateAuthentication(
				{ issuer: "dev", subject: "bob" },
				"Bob",
			);

			expect(yield* repository.listAll()).to.have.deep.members([
				{
					id: alice.userId,
					displayName: "Alice",
					authentications: [{ issuer: "dev", subject: "alice" }],
					roles: [viewer],
					globalRoles: ["admin"],
				},
				{
					id: bob.userId,
					displayName: "Bob",
					authentications: [{ issuer: "dev", subject: "bob" }],
					roles: [],
					globalRoles: [],
				},
			]);
		}),
	);
});

describe("grantRoles", () => {
	test(
		"grants the roles",
		Effect.gen(function* () {
			const repository = yield* UserRepositoryService;
			const alice = yield* createUser("alice");
			const bob = yield* createUser("bob");
			yield* repository.grantRoles(alice, HashSet.make(viewer));

			yield* repository.grantRoles(alice, HashSet.make(viewer, producer));

			const users = yield* repository.listAll();
			expect(users).toEqual(
				expect.arrayContaining([
					expect.objectContaining({
						id: alice,
						roles: expect.arrayContaining([viewer, producer]),
					}),
					expect.objectContaining({ id: bob, roles: [] }),
				]),
			);
			expect(users.flatMap(({ roles }) => roles)).toHaveLength(2);
		}),
	);

	test(
		"grants and revokes nothing for an empty set",
		Effect.gen(function* () {
			const repository = yield* UserRepositoryService;
			const alice = yield* createUser("alice");
			yield* repository.grantRoles(alice, HashSet.make(viewer));

			yield* repository.grantRoles(alice, HashSet.empty());
			yield* repository.revokeRoles(alice, HashSet.empty());

			expect(yield* repository.listAll()).toMatchObject([{ roles: [viewer] }]);
		}),
	);

	test(
		"grants and revokes more roles than fit in one statement",
		Effect.gen(function* () {
			const repository = yield* UserRepositoryService;
			const alice = yield* createUser("alice");
			const roles = HashSet.fromIterable(
				Array.makeBy(10_923, (index) =>
					Role.make({
						namespace: "show",
						name: RoleName.make(`role-${index}`),
					}),
				),
			);

			yield* repository.grantRoles(alice, roles);
			expect(yield* repository.listAll()).toMatchObject([
				{ roles: { length: 10_923 } },
			]);

			yield* repository.revokeRoles(alice, roles);
			expect(yield* repository.listAll()).toMatchObject([{ roles: [] }]);
		}),
	);

	test(
		"fails with UnknownUser when the user does not exist",
		Effect.gen(function* () {
			const repository = yield* UserRepositoryService;
			const missing = UserId.make("missing");

			const error = yield* repository
				.grantRoles(missing, HashSet.make(viewer))
				.pipe(Effect.flip);

			expect(error).toStrictEqual(UnknownUser.make({ userId: missing }));
		}),
	);
});

describe("revokeRoles", () => {
	test(
		"revokes the roles in their namespace only",
		Effect.gen(function* () {
			const repository = yield* UserRepositoryService;
			const alice = yield* createUser("alice");
			yield* repository.grantRoles(
				alice,
				HashSet.make(viewer, producer, otherViewer),
			);

			yield* repository.revokeRoles(alice, HashSet.make(viewer, producer));

			expect(yield* repository.listAll()).toMatchObject([
				{ roles: [otherViewer] },
			]);
		}),
	);

	test(
		"fails with UnknownUser when the user does not exist",
		Effect.gen(function* () {
			const repository = yield* UserRepositoryService;
			const missing = UserId.make("missing");

			const error = yield* repository
				.revokeRoles(missing, HashSet.make(viewer))
				.pipe(Effect.flip);

			expect(error).toStrictEqual(UnknownUser.make({ userId: missing }));
		}),
	);
});

describe("grantGlobalRole", () => {
	test(
		"grants the global role",
		Effect.gen(function* () {
			const repository = yield* UserRepositoryService;
			const alice = yield* createUser("alice");
			const bob = yield* createUser("bob");

			yield* repository.grantGlobalRole(alice, "admin");
			yield* repository.grantGlobalRole(alice, "admin");

			expect(yield* repository.listAll()).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ id: alice, globalRoles: ["admin"] }),
					expect.objectContaining({ id: bob, globalRoles: [] }),
				]),
			);
		}),
	);

	test(
		"fails with UnknownUser when the user does not exist",
		Effect.gen(function* () {
			const repository = yield* UserRepositoryService;
			const missing = UserId.make("missing");

			const error = yield* repository
				.grantGlobalRole(missing, "admin")
				.pipe(Effect.flip);

			expect(error).toStrictEqual(UnknownUser.make({ userId: missing }));
		}),
	);
});

describe("revokeGlobalRole", () => {
	test(
		"revokes the named global role only",
		Effect.gen(function* () {
			const repository = yield* UserRepositoryService;
			const alice = yield* createUser("alice");
			yield* repository.grantGlobalRole(alice, "admin");
			yield* repository.grantGlobalRole(alice, "superadmin");

			yield* repository.revokeGlobalRole(alice, "superadmin");

			expect(yield* repository.listAll()).toMatchObject([
				{ globalRoles: ["admin"] },
			]);
		}),
	);

	test(
		"fails with UnknownUser when the user does not exist",
		Effect.gen(function* () {
			const repository = yield* UserRepositoryService;
			const missing = UserId.make("missing");

			const error = yield* repository
				.revokeGlobalRole(missing, "admin")
				.pipe(Effect.flip);

			expect(error).toStrictEqual(UnknownUser.make({ userId: missing }));
		}),
	);
});
