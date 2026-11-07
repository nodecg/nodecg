import type { GlobalRoleName } from "@nodecg-next/internal";
import { eq } from "drizzle-orm";
import { Effect, Layer } from "effect";

import { DrizzleSqliteDatabaseService } from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import {
	globalRoleGrants,
	roleGrants,
} from "../../database/drizzle-sqlite/tables.ts";
import { BackendError } from "../repository-errors.ts";
import { RoleRepositoryService } from "./role-repository.ts";

export const DrizzleSqliteRoleRepository = Layer.effect(
	RoleRepositoryService,
	Effect.gen(function* () {
		const db = yield* DrizzleSqliteDatabaseService;

		const listAll = Effect.fn("RoleRepository.listAll")(
			function* () {
				const rows = yield* db.query.authentications.findMany({
					columns: { issuer: true, subject: true },
					where: {
						user: {
							account: {
								OR: [{ roleGrants: true }, { globalRoleGrants: true }],
							},
						},
					},
					with: {
						user: {
							columns: {},
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
				});
				return rows.map(({ issuer, subject, user: { account } }) => ({
					authentication: { issuer, subject },
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

		const globalRoleExists = Effect.fn("RoleRepository.globalRoleExists")(
			function* (role: GlobalRoleName) {
				const rows = yield* db
					.select({ accountId: globalRoleGrants.accountId })
					.from(globalRoleGrants)
					.where(eq(globalRoleGrants.roleName, role))
					.limit(1);
				return rows.length > 0;
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		const revokeAllRoles = Effect.fn("RoleRepository.revokeAllRoles")(
			function* () {
				yield* db.delete(roleGrants);
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		return { listAll, globalRoleExists, revokeAllRoles };
	}),
);
