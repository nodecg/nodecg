import type { AuthenticationId, UserSessionId } from "@nodecg-next/internal";
import { and, eq, gt, lt } from "drizzle-orm";
import { DateTime, Effect, Layer, Option } from "effect";

import { DrizzleSqliteDatabaseService } from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { sessions } from "../../database/drizzle-sqlite/tables.ts";
import { BackendError, KeyTaken } from "../repository-errors.ts";
import { SessionRepositoryService } from "./session-repository.ts";

export const DrizzleSqliteSessionRepository = Layer.effect(
	SessionRepositoryService,
	Effect.gen(function* () {
		const db = yield* DrizzleSqliteDatabaseService;

		const create = Effect.fn("SessionRepository.create")(
			function* (
				id: UserSessionId,
				authenticationId: AuthenticationId,
				expiresAt: DateTime.DateTime,
			) {
				const inserted = yield* db
					.insert(sessions)
					.values({
						id,
						authenticationId,
						expiresAt: DateTime.toEpochMillis(expiresAt),
					})
					.onConflictDoNothing({ target: sessions.id })
					.returning({ id: sessions.id });
				if (inserted.length === 0) {
					return yield* KeyTaken.make();
				}
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		const resolve = Effect.fn("SessionRepository.resolve")(
			function* (id: UserSessionId) {
				const now = yield* DateTime.now;
				const session = yield* db.query.sessions
					.findFirst({
						columns: { id: true },
						where: { id, expiresAt: { gt: DateTime.toEpochMillis(now) } },
						with: {
							authentication: {
								columns: { issuer: true, subject: true },
								with: {
									user: {
										columns: { id: true },
										with: {
											authentications: {
												columns: { issuer: true, subject: true },
											},
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
							},
						},
					})
					.pipe(Effect.map(Option.fromUndefinedOr));
				return session.pipe(
					Option.map(({ authentication: { issuer, subject, user } }) => ({
						authentication: { issuer, subject },
						user: {
							id: user.id,
							displayName: user.account.displayName,
							authentications: user.authentications,
							roles: user.account.roleGrants.map(({ namespace, roleName }) => ({
								namespace,
								name: roleName,
							})),
							globalRoles: user.account.globalRoleGrants.map(
								({ roleName }) => roleName,
							),
						},
					})),
				);
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		const refreshTTL = Effect.fn("SessionRepository.refreshTTL")(
			function* (
				id: UserSessionId,
				expiresAt: DateTime.DateTime,
				ifExpiresBefore: DateTime.DateTime,
			) {
				const now = yield* DateTime.now;
				const rows = yield* db
					.update(sessions)
					.set({ expiresAt: DateTime.toEpochMillis(expiresAt) })
					.where(
						and(
							eq(sessions.id, id),
							gt(sessions.expiresAt, DateTime.toEpochMillis(now)),
							lt(sessions.expiresAt, DateTime.toEpochMillis(ifExpiresBefore)),
						),
					)
					.returning({ id: sessions.id });
				return rows.length > 0;
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		const revoke = Effect.fn("SessionRepository.revoke")(
			function* (id: UserSessionId) {
				yield* db.delete(sessions).where(eq(sessions.id, id));
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		return { create, resolve, refreshTTL, revoke };
	}),
);
