import type { GlobalRoleName, Role, UserId } from "@nodecg-next/internal";
import { and, eq, inArray } from "drizzle-orm";
import { Array, Effect, type HashSet, Layer, Option } from "effect";

import {
	DrizzleSqliteDatabaseService,
	makeQueryInChunks,
} from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import {
	globalRoleGrants,
	roleGrants,
} from "../../database/drizzle-sqlite/tables.ts";
import { BackendError } from "../repository-errors.ts";
import { UnknownUser, UserRepositoryService } from "./user-repository.ts";

export const DrizzleSqliteUserRepository = Layer.effect(
	UserRepositoryService,
	Effect.gen(function* () {
		const db = yield* DrizzleSqliteDatabaseService;
		const queryInChunks = yield* makeQueryInChunks;

		const listAll = Effect.fn("UserRepository.listAll")(
			function* () {
				const rows = yield* db.query.users.findMany({
					columns: { id: true },
					with: {
						authentications: { columns: { issuer: true, subject: true } },
						account: {
							columns: { displayName: true },
							with: {
								roleGrants: { columns: { namespace: true, roleName: true } },
								globalRoleGrants: { columns: { roleName: true } },
							},
						},
					},
				});
				return rows.map(({ id, authentications, account }) => ({
					id,
					displayName: account.displayName,
					authentications,
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

		const requireAccountId = Effect.fnUntraced(function* (id: UserId) {
			const user = yield* db.query.users
				.findFirst({ columns: { accountId: true }, where: { id } })
				.pipe(Effect.map(Option.fromUndefinedOr));
			if (Option.isNone(user)) {
				return yield* UnknownUser.make({ userId: id });
			}
			return user.value.accountId;
		});

		const grantRoles = Effect.fn("UserRepository.grantRoles")(
			function* (id: UserId, roles: HashSet.HashSet<Role>) {
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

		const revokeRoles = Effect.fn("UserRepository.revokeRoles")(
			function* (id: UserId, roles: HashSet.HashSet<Role>) {
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

		const grantGlobalRole = Effect.fn("UserRepository.grantGlobalRole")(
			function* (id: UserId, role: GlobalRoleName) {
				yield* db.transaction(() =>
					Effect.gen(function* () {
						const accountId = yield* requireAccountId(id);
						yield* db
							.insert(globalRoleGrants)
							.values({ accountId, roleName: role })
							.onConflictDoNothing();
					}),
				);
			},
			Effect.catchTag(["EffectDrizzleQueryError", "SqlError"], (cause) =>
				BackendError.make({ cause }),
			),
		);

		const revokeGlobalRole = Effect.fn("UserRepository.revokeGlobalRole")(
			function* (id: UserId, role: GlobalRoleName) {
				yield* db.transaction(() =>
					Effect.gen(function* () {
						const accountId = yield* requireAccountId(id);
						yield* db
							.delete(globalRoleGrants)
							.where(
								and(
									eq(globalRoleGrants.accountId, accountId),
									eq(globalRoleGrants.roleName, role),
								),
							);
					}),
				);
			},
			Effect.catchTag(["EffectDrizzleQueryError", "SqlError"], (cause) =>
				BackendError.make({ cause }),
			),
		);

		return {
			listAll,
			grantRoles,
			revokeRoles,
			grantGlobalRole,
			revokeGlobalRole,
		};
	}),
);
