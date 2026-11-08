import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { testLayer } from "@nodecg-private/test-utils";
import { Role, RoleName, ServiceAccountId, UserId } from "@nodecg/internal";
import { eq } from "drizzle-orm";
import { Array, Effect, HashSet, Layer, Option, Schema } from "effect";
import { Reactivity } from "effect/reactivity";
import { TestClock } from "effect/testing";
import { assert, describe, expect } from "vitest";

import { DrizzleSqliteDatabaseService } from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import {
	apiKeys,
	globalRoleGrants,
	roleGrants,
	serviceAccounts,
	users,
} from "../../database/drizzle-sqlite/tables.ts";
import { AuthenticationRepositoryService } from "../authentication/authentication-repository.ts";
import { DrizzleSqliteAuthenticationRepository } from "../authentication/drizzle-sqlite-authentication-repository.ts";
import { BackendError } from "../repository-errors.ts";
import { DrizzleSqliteServiceAccountRepository } from "./drizzle-sqlite-service-account-repository.ts";
import {
	ServiceAccountRepositoryService,
	UnknownServiceAccount,
} from "./service-account-repository.ts";

const test = testLayer(
	Layer.mergeAll(
		DrizzleSqliteServiceAccountRepository,
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
const judge = Role.make({
	namespace: "show",
	name: RoleName.make("judge"),
});
const producer = Role.make({
	namespace: "show",
	name: RoleName.make("producer"),
});
const ghost = ServiceAccountId.make("00000000-0000-4000-8000-0000000000ff");

const createAlice = Effect.gen(function* () {
	const authentications = yield* AuthenticationRepositoryService;
	const { userId } = yield* authentications.findOrCreateAuthentication(
		{ issuer: "dev", subject: "alice" },
		"Alice",
	);
	return userId;
});

const createBot = Effect.fn(function* (displayName: string, hash: string) {
	const repository = yield* ServiceAccountRepositoryService;
	const id = yield* repository.create({
		displayName,
		createdBy: yield* createAlice,
	});
	yield* repository.addKey(id, { hash, label: "" });
	return id;
});

const findAccountId = Effect.fn(function* (id: ServiceAccountId) {
	const db = yield* DrizzleSqliteDatabaseService;
	const { accountId } = yield* db
		.select({ accountId: serviceAccounts.accountId })
		.from(serviceAccounts)
		.where(eq(serviceAccounts.id, id))
		.pipe(Effect.head);
	return accountId;
});

const createdBy = Effect.fn(function* (id: ServiceAccountId) {
	const db = yield* DrizzleSqliteDatabaseService;
	const rows = yield* db
		.select({ createdBy: serviceAccounts.createdBy })
		.from(serviceAccounts)
		.where(eq(serviceAccounts.id, id));
	return rows;
});

describe("create", () => {
	test(
		"creates a service account under its own named account",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const id = yield* createBot("scoreboard", "hash-1");

			const serviceAccounts = yield* repository.listAll();
			expect(
				serviceAccounts.map(({ id, displayName }) => ({ id, displayName })),
			).toStrictEqual([{ id, displayName: "scoreboard" }]);
		}),
	);

	test(
		"records the creating user",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const alice = yield* createAlice;

			const id = yield* repository.create({
				displayName: "scoreboard",
				createdBy: alice,
			});

			const rows = yield* createdBy(id);
			expect(rows).toStrictEqual([{ createdBy: alice }]);
		}),
	);

	test(
		"fails with BackendError when the user does not exist",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;

			const error = yield* repository
				.create({
					displayName: "scoreboard",
					createdBy: UserId.make("missing"),
				})
				.pipe(Effect.flip);

			assert(Schema.is(BackendError)(error));
			expect(error.message).toContain("FOREIGN KEY constraint failed");
			expect(yield* repository.listAll()).toStrictEqual([]);
		}),
	);
});

describe("createWithId", () => {
	test(
		"creates a service account under the given id",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const alice = yield* createAlice;

			yield* repository.createWithId({
				id: ghost,
				displayName: "scoreboard",
				createdBy: alice,
			});

			const serviceAccount = yield* repository.resolveById(ghost);
			expect(serviceAccount).toStrictEqual(
				Option.some({ id: ghost, displayName: "scoreboard" }),
			);
			const rows = yield* createdBy(ghost);
			expect(rows).toStrictEqual([{ createdBy: alice }]);
		}),
	);

	test(
		"fails with BackendError when the id is taken",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const alice = yield* createAlice;
			yield* repository.createWithId({
				id: ghost,
				displayName: "scoreboard",
				createdBy: alice,
			});

			const error = yield* repository
				.createWithId({
					id: ghost,
					displayName: "timer",
					createdBy: alice,
				})
				.pipe(Effect.flip);

			assert(Schema.is(BackendError)(error));
			expect(error.message).toContain(
				"UNIQUE constraint failed: service_accounts.id",
			);
			const serviceAccounts = yield* repository.listAll();
			expect(serviceAccounts).toStrictEqual([
				{
					id: ghost,
					displayName: "scoreboard",
					roles: [],
					globalRoles: [],
				},
			]);
		}),
	);

	test(
		"fails with BackendError when the user does not exist",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;

			const error = yield* repository
				.createWithId({
					id: ghost,
					displayName: "scoreboard",
					createdBy: UserId.make("missing"),
				})
				.pipe(Effect.flip);

			assert(Schema.is(BackendError)(error));
			expect(error.message).toContain("FOREIGN KEY constraint failed");
			expect(yield* repository.listAll()).toStrictEqual([]);
		}),
	);
});

describe("resolveById", () => {
	test(
		"resolves an id to its service account",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			yield* createBot("timer", "hash-1");
			const scoreboard = yield* createBot("scoreboard", "hash-2");

			const serviceAccount = yield* repository.resolveById(scoreboard);
			expect(serviceAccount).toStrictEqual(
				Option.some({ id: scoreboard, displayName: "scoreboard" }),
			);
		}),
	);

	test(
		"treats an unknown id as absent",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			yield* createBot("scoreboard", "hash-1");

			const resolved = yield* repository.resolveById(ghost);
			expect(resolved).toStrictEqual(Option.none());
		}),
	);
});

describe("resolveByKeyHash", () => {
	test(
		"resolves a key to its service account",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const db = yield* DrizzleSqliteDatabaseService;
			const id = yield* createBot("scoreboard", "hash-1");
			yield* repository.grantRoles(id, HashSet.make(viewer));
			yield* db
				.insert(globalRoleGrants)
				.values({ accountId: yield* findAccountId(id), roleName: "admin" });

			const byKey = yield* repository.resolveByKeyHash("hash-1");

			expect(byKey).toStrictEqual(
				Option.some({
					id,
					displayName: "scoreboard",
					roles: [viewer],
					globalRoles: ["admin"],
				}),
			);
		}),
	);

	test(
		"resolves nothing for an unknown key",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			yield* createBot("scoreboard", "hash-1");

			const resolved = yield* repository.resolveByKeyHash("hash-2");

			expect(resolved).toStrictEqual(Option.none());
		}),
	);

	test(
		"resolves a key until it expires",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const db = yield* DrizzleSqliteDatabaseService;
			const id = yield* createBot("scoreboard", "hash-1");
			yield* db
				.update(apiKeys)
				.set({ expiresAt: 100 })
				.where(eq(apiKeys.serviceAccountId, id));

			yield* TestClock.setTime(99);
			const before = yield* repository.resolveByKeyHash("hash-1");
			assert(Option.isSome(before));
			yield* TestClock.setTime(100);
			const at = yield* repository.resolveByKeyHash("hash-1");
			expect(at).toStrictEqual(Option.none());
		}),
	);
});

describe("listAll", () => {
	test(
		"lists every service account with its own roles and global roles",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const db = yield* DrizzleSqliteDatabaseService;
			const scoreboard = yield* createBot("scoreboard", "hash-1");
			const timer = yield* createBot("timer", "hash-2");
			yield* repository.grantRoles(scoreboard, HashSet.make(viewer));
			yield* db.insert(globalRoleGrants).values({
				accountId: yield* findAccountId(scoreboard),
				roleName: "admin",
			});

			const serviceAccounts = yield* repository.listAll();

			expect(serviceAccounts).toEqual(
				expect.arrayContaining([
					{
						id: scoreboard,
						displayName: "scoreboard",
						roles: [viewer],
						globalRoles: ["admin"],
					},
					{
						id: timer,
						displayName: "timer",
						roles: [],
						globalRoles: [],
					},
				]),
			);
			expect(serviceAccounts).toHaveLength(2);
		}),
	);
});

describe("replaceKey", () => {
	test(
		"replaces the old key with the new one and reports the name",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const id = yield* createBot("scoreboard", "hash-1");

			const serviceAccount = yield* repository.replaceKey(id, {
				hash: "hash-2",
				label: "",
			});

			expect(serviceAccount).toStrictEqual(
				Option.some({ displayName: "scoreboard" }),
			);
			const old = yield* repository.resolveByKeyHash("hash-1");
			expect(old).toStrictEqual(Option.none());
			const current = yield* repository.resolveByKeyHash("hash-2");
			assert(Option.isSome(current));
			expect(current.value.id).toBe(id);
		}),
	);

	test(
		"reports nothing and stores no key for an unknown id",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;

			const replaced = yield* repository.replaceKey(ghost, {
				hash: "hash-1",
				label: "",
			});

			expect(replaced).toStrictEqual(Option.none());
			const byKey = yield* repository.resolveByKeyHash("hash-1");
			expect(byKey).toStrictEqual(Option.none());
		}),
	);
});

describe("delete", () => {
	test(
		"removes the service account with its key and role grants",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const db = yield* DrizzleSqliteDatabaseService;
			const id = yield* createBot("scoreboard", "hash-1");
			yield* repository.grantRoles(id, HashSet.make(viewer));

			const found = yield* repository.delete(id);

			expect(found).toBe(true);
			const listed = yield* repository.listAll();
			expect(listed).toStrictEqual([]);
			const byKey = yield* repository.resolveByKeyHash("hash-1");
			expect(byKey).toStrictEqual(Option.none());
			expect(yield* db.select().from(roleGrants)).toStrictEqual([]);
		}),
	);

	test(
		"reports an unknown id",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			yield* createBot("scoreboard", "hash-1");

			const found = yield* repository.delete(ghost);

			expect(found).toBe(false);
			const listed = yield* repository.listAll();
			expect(listed).toHaveLength(1);
		}),
	);

	test(
		"keeps a service account after its creating user is deleted",
		Effect.gen(function* () {
			const db = yield* DrizzleSqliteDatabaseService;
			const alice = yield* createAlice;
			const id = yield* createBot("scoreboard", "hash-1");

			yield* db.delete(users).where(eq(users.id, alice));

			const rows = yield* createdBy(id);
			expect(rows).toStrictEqual([{ createdBy: null }]);
		}),
	);
});

describe("grantRoles", () => {
	test(
		"grants the roles to the service account, also when already held",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const id = yield* createBot("scoreboard", "hash-1");

			yield* repository.grantRoles(id, HashSet.make(viewer));
			yield* repository.grantRoles(id, HashSet.make(viewer, judge));

			const serviceAccounts = yield* repository.listAll();
			expect(serviceAccounts).toEqual([
				expect.objectContaining({
					roles: expect.arrayContaining([viewer, judge]),
				}),
			]);
			expect(serviceAccounts.flatMap(({ roles }) => roles)).toHaveLength(2);
		}),
	);

	test(
		"grants and revokes nothing for an empty set",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const id = yield* createBot("scoreboard", "hash-1");
			yield* repository.grantRoles(id, HashSet.make(viewer));

			yield* repository.grantRoles(id, HashSet.empty());
			yield* repository.revokeRoles(id, HashSet.empty());

			expect(yield* repository.listAll()).toMatchObject([{ roles: [viewer] }]);
		}),
	);

	test(
		"grants and revokes more roles than fit in one statement",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const id = yield* createBot("scoreboard", "hash-1");
			const roles = HashSet.fromIterable(
				Array.makeBy(10_923, (index) =>
					Role.make({
						namespace: "show",
						name: RoleName.make(`role-${index}`),
					}),
				),
			);

			yield* repository.grantRoles(id, roles);
			expect(yield* repository.listAll()).toMatchObject([
				{ roles: { length: 10_923 } },
			]);

			yield* repository.revokeRoles(id, roles);
			expect(yield* repository.listAll()).toMatchObject([{ roles: [] }]);
		}),
	);

	test(
		"fails with UnknownServiceAccount when the service account does not exist",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;

			const error = yield* repository
				.grantRoles(ghost, HashSet.make(viewer))
				.pipe(Effect.flip);

			expect(error).toStrictEqual(
				UnknownServiceAccount.make({ serviceAccountId: ghost }),
			);
		}),
	);
});

describe("revokeRoles", () => {
	test(
		"revokes the roles, also when not held",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;
			const id = yield* createBot("scoreboard", "hash-1");
			yield* repository.grantRoles(id, HashSet.make(viewer, judge, producer));

			yield* repository.revokeRoles(id, HashSet.make(viewer, judge));
			yield* repository.revokeRoles(id, HashSet.make(viewer, judge));

			expect(yield* repository.listAll()).toMatchObject([
				{ roles: [producer] },
			]);
		}),
	);

	test(
		"fails with UnknownServiceAccount when the service account does not exist",
		Effect.gen(function* () {
			const repository = yield* ServiceAccountRepositoryService;

			const error = yield* repository
				.revokeRoles(ghost, HashSet.make(viewer))
				.pipe(Effect.flip);

			expect(error).toStrictEqual(
				UnknownServiceAccount.make({ serviceAccountId: ghost }),
			);
		}),
	);
});
