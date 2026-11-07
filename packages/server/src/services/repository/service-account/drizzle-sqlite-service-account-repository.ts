import {
	ApiKeyId,
	type Role,
	ServiceAccountId,
	type UserId,
} from "@nodecg-next/internal";
import { and, eq, inArray } from "drizzle-orm";
import { Array, DateTime, Effect, type HashSet, Layer, Option } from "effect";
import { SecureRandom } from "effect/crypto";

import {
	DrizzleSqliteDatabaseService,
	makeQueryInChunks,
} from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { retryOnIdCollision } from "../../database/drizzle-sqlite/retry-on-id-collision.ts";
import {
	AccountId,
	accounts,
	apiKeys,
	roleGrants,
	serviceAccounts,
} from "../../database/drizzle-sqlite/tables.ts";
import { BackendError } from "../repository-errors.ts";
import {
	type NewApiKey,
	ServiceAccountRepositoryService,
	UnknownServiceAccount,
} from "./service-account-repository.ts";

export const DrizzleSqliteServiceAccountRepository = Layer.effect(
	ServiceAccountRepositoryService,
	Effect.gen(function* () {
		const random = yield* SecureRandom.SecureRandom;
		const db = yield* DrizzleSqliteDatabaseService;
		const queryInChunks = yield* makeQueryInChunks;

		const requireAccountId = Effect.fnUntraced(function* (
			id: ServiceAccountId,
		) {
			const serviceAccount = yield* db.query.serviceAccounts
				.findFirst({ columns: { accountId: true }, where: { id } })
				.pipe(Effect.map(Option.fromUndefinedOr));
			if (Option.isNone(serviceAccount)) {
				return yield* UnknownServiceAccount.make({ serviceAccountId: id });
			}
			return serviceAccount.value.accountId;
		});

		const insertKey = Effect.fn(function* (
			serviceAccountId: ServiceAccountId,
			key: NewApiKey,
		) {
			const now = yield* DateTime.now;
			yield* db.insert(apiKeys).values({
				id: ApiKeyId.make(yield* random.uuidV7()),
				serviceAccountId,
				keyHash: key.hash,
				label: key.label,
				createdAt: DateTime.toEpochMillis(now),
			});
		}, retryOnIdCollision);

		const insertAccount = Effect.fn(function* (displayName: string) {
			const now = yield* DateTime.now;
			const uuid = yield* random.uuidV7();
			const id = AccountId.make(uuid);
			yield* db.insert(accounts).values({
				id,
				displayName,
				createdAt: DateTime.toEpochMillis(now),
			});
			return id;
		}, retryOnIdCollision);

		const insertServiceAccount = Effect.fn(function* (
			accountId: AccountId,
			createdBy: UserId,
		) {
			const uuid = yield* random.uuidV7();
			const id = ServiceAccountId.make(uuid);
			yield* db.insert(serviceAccounts).values({ id, accountId, createdBy });
			return id;
		}, retryOnIdCollision);

		const create = Effect.fn("ServiceAccountRepository.create")(
			function* (input: {
				readonly displayName: string;
				readonly createdBy: UserId;
			}) {
				return yield* db.transaction(() =>
					Effect.gen(function* () {
						const accountId = yield* insertAccount(input.displayName);
						return yield* insertServiceAccount(accountId, input.createdBy);
					}),
				);
			},
			Effect.catchTag(["EffectDrizzleQueryError", "SqlError"], (cause) =>
				BackendError.make({ cause }),
			),
		);

		const createWithId = Effect.fn("ServiceAccountRepository.createWithId")(
			function* (input: {
				readonly id: ServiceAccountId;
				readonly displayName: string;
				readonly createdBy: UserId;
			}) {
				yield* db.transaction(() =>
					Effect.gen(function* () {
						const accountId = yield* insertAccount(input.displayName);
						yield* db.insert(serviceAccounts).values({
							id: input.id,
							accountId,
							createdBy: input.createdBy,
						});
					}),
				);
			},
			Effect.catchTag(["EffectDrizzleQueryError", "SqlError"], (cause) =>
				BackendError.make({ cause }),
			),
		);

		const resolveById = Effect.fn("ServiceAccountRepository.resolveById")(
			function* (id: ServiceAccountId) {
				const rows = yield* db
					.select({
						id: serviceAccounts.id,
						displayName: accounts.displayName,
					})
					.from(serviceAccounts)
					.innerJoin(accounts, eq(accounts.id, serviceAccounts.accountId))
					.where(eq(serviceAccounts.id, id));
				return Array.head(rows);
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		const resolveByKeyHash = Effect.fn(
			"ServiceAccountRepository.resolveByKeyHash",
		)(
			function* (hash: string) {
				const now = yield* DateTime.now;
				const key = yield* db.query.apiKeys
					.findFirst({
						columns: {},
						where: {
							keyHash: hash,
							expiresAt: {
								OR: [{ isNull: true }, { gt: DateTime.toEpochMillis(now) }],
							},
						},
						with: {
							serviceAccount: {
								columns: { id: true },
								with: {
									account: {
										columns: { displayName: true },
										with: {
											roleGrants: {
												columns: { namespace: true, roleName: true },
											},
											globalRoleGrants: { columns: { roleName: true } },
										},
									},
								},
							},
						},
					})
					.pipe(Effect.map(Option.fromUndefinedOr));
				return key.pipe(
					Option.map(({ serviceAccount: { id, account } }) => ({
						id,
						displayName: account.displayName,
						roles: account.roleGrants.map(({ namespace, roleName }) => ({
							namespace,
							name: roleName,
						})),
						globalRoles: account.globalRoleGrants.map(
							({ roleName }) => roleName,
						),
					})),
				);
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		const listAll = Effect.fn("ServiceAccountRepository.listAll")(
			function* () {
				const rows = yield* db.query.serviceAccounts.findMany({
					columns: { id: true },
					with: {
						account: {
							columns: { displayName: true },
							with: {
								roleGrants: { columns: { namespace: true, roleName: true } },
								globalRoleGrants: { columns: { roleName: true } },
							},
						},
					},
				});
				return rows.map(({ id, account }) => ({
					id,
					displayName: account.displayName,
					roles: account.roleGrants.map(({ namespace, roleName }) => ({
						namespace,
						name: roleName,
					})),
					globalRoles: account.globalRoleGrants.map(({ roleName }) => roleName),
				}));
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		const addKey = Effect.fn("ServiceAccountRepository.addKey")(
			function* (id: ServiceAccountId, key: NewApiKey) {
				yield* insertKey(id, key);
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		const replaceKey = Effect.fn("ServiceAccountRepository.replaceKey")(
			function* (id: ServiceAccountId, key: NewApiKey) {
				return yield* db.transaction(() =>
					Effect.gen(function* () {
						const found = Array.head(
							yield* db
								.select({ displayName: accounts.displayName })
								.from(serviceAccounts)
								.innerJoin(accounts, eq(accounts.id, serviceAccounts.accountId))
								.where(eq(serviceAccounts.id, id)),
						);
						if (Option.isNone(found)) {
							return found;
						}
						yield* db.delete(apiKeys).where(eq(apiKeys.serviceAccountId, id));
						yield* insertKey(id, key);
						return found;
					}),
				);
			},
			Effect.catchTag(["EffectDrizzleQueryError", "SqlError"], (cause) =>
				BackendError.make({ cause }),
			),
		);

		const deleteOne = Effect.fn("ServiceAccountRepository.delete")(
			function* (id: ServiceAccountId) {
				const deleted = yield* db
					.delete(accounts)
					.where(
						inArray(
							accounts.id,
							db
								.select({ accountId: serviceAccounts.accountId })
								.from(serviceAccounts)
								.where(eq(serviceAccounts.id, id)),
						),
					)
					.returning({ id: accounts.id });
				return deleted.length > 0;
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		const grantRoles = Effect.fn("ServiceAccountRepository.grantRoles")(
			function* (id: ServiceAccountId, roles: HashSet.HashSet<Role>) {
				yield* db.transaction(() =>
					Effect.gen(function* () {
						const accountId = yield* requireAccountId(id);
						const rows = Array.fromIterable(roles).map(
							({ namespace, name }) => ({
								accountId,
								namespace,
								roleName: name,
							}),
						);
						yield* queryInChunks(rows, (chunk) =>
							db.insert(roleGrants).values(chunk).onConflictDoNothing(),
						);
					}),
				);
			},
			Effect.catchTag(["EffectDrizzleQueryError", "SqlError"], (cause) =>
				BackendError.make({ cause }),
			),
		);

		const revokeRoles = Effect.fn("ServiceAccountRepository.revokeRoles")(
			function* (id: ServiceAccountId, roles: HashSet.HashSet<Role>) {
				yield* db.transaction(() =>
					Effect.gen(function* () {
						const accountId = yield* requireAccountId(id);
						const rolesByNamespace = Map.groupBy(
							roles,
							({ namespace }) => namespace,
						);
						for (const [namespace, namespaceRoles] of rolesByNamespace) {
							const rows = namespaceRoles.map(({ name }) => ({
								accountId,
								namespace,
								roleName: name,
							}));
							yield* queryInChunks(rows, (chunk) =>
								db.delete(roleGrants).where(
									and(
										eq(roleGrants.accountId, accountId),
										eq(roleGrants.namespace, namespace),
										inArray(
											roleGrants.roleName,
											chunk.map(({ roleName }) => roleName),
										),
									),
								),
							);
						}
					}),
				);
			},
			Effect.catchTag(["EffectDrizzleQueryError", "SqlError"], (cause) =>
				BackendError.make({ cause }),
			),
		);

		return {
			create,
			createWithId,
			resolveById,
			resolveByKeyHash,
			listAll,
			addKey,
			replaceKey,
			delete: deleteOne,
			grantRoles,
			revokeRoles,
		};
	}),
);
