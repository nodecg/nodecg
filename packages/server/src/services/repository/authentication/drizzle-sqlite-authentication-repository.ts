import {
	type Authentication,
	AuthenticationId,
	UserId,
} from "@nodecg-next/internal";
import { and, eq, sql } from "drizzle-orm";
import { Array, DateTime, Effect, Layer, Option } from "effect";
import { SecureRandom } from "effect/crypto";

import { DrizzleSqliteDatabaseService } from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { retryOnIdCollision } from "../../database/drizzle-sqlite/retry-on-id-collision.ts";
import {
	AccountId,
	accounts,
	authentications,
	users,
} from "../../database/drizzle-sqlite/tables.ts";
import { BackendError } from "../repository-errors.ts";
import { AuthenticationRepositoryService } from "./authentication-repository.ts";

export const DrizzleSqliteAuthenticationRepository = Layer.effect(
	AuthenticationRepositoryService,
	Effect.gen(function* () {
		const random = yield* SecureRandom.SecureRandom;
		const db = yield* DrizzleSqliteDatabaseService;

		const insertMissing = Effect.fn(function* (
			inputs: Array.NonEmptyReadonlyArray<{
				readonly authentication: Authentication;
				readonly displayName: string;
			}>,
		) {
			return yield* db
				.transaction(() =>
					Effect.gen(function* () {
						yield* db.run(sql`PRAGMA defer_foreign_keys = ON`);

						const authenticationRows = yield* Effect.forEach(
							inputs,
							Effect.fn(function* ({
								authentication: { issuer, subject },
								displayName,
							}) {
								return {
									id: AuthenticationId.make(yield* random.uuidV7()),
									userId: UserId.make(yield* random.uuidV7()),
									issuer,
									subject,
									displayName,
								};
							}),
						);
						const insertedAuthentications = yield* db
							.insert(authentications)
							.values(
								authenticationRows.map(({ id, userId, issuer, subject }) => ({
									id,
									userId,
									issuer,
									subject,
								})),
							)
							.onConflictDoNothing({
								target: [authentications.issuer, authentications.subject],
							})
							.returning({
								id: authentications.id,
							});
						const insertedAuthenticationRows = authenticationRows.filter(
							({ id }) =>
								insertedAuthentications.some(
									({ id: insertedId }) => id === insertedId,
								),
						);

						if (Array.isArrayEmpty(insertedAuthentications)) {
							return [];
						}

						const accountRows = yield* Effect.forEach(
							insertedAuthenticationRows,
							Effect.fn(function* ({
								id: authenticationId,
								userId,
								displayName,
							}) {
								return {
									authenticationId,
									userId,
									displayName,
									accountId: AccountId.make(yield* random.uuidV7()),
								};
							}),
						);
						const now = yield* DateTime.now;
						yield* db.insert(accounts).values(
							accountRows.map(({ accountId, displayName }) => ({
								id: accountId,
								displayName,
								createdAt: DateTime.toEpochMillis(now),
							})),
						);
						yield* db.insert(users).values(
							accountRows.map(({ userId, accountId }) => ({
								id: userId,
								accountId,
							})),
						);
						return accountRows.map(({ authenticationId, userId }) => ({
							authenticationId,
							userId,
						}));
					}),
				)
				.pipe(retryOnIdCollision);
		});

		return {
			findOrCreateAuthentication: Effect.fn(
				"AuthenticationRepository.findOrCreateAuthentication",
			)(
				function* (authentication, displayName) {
					const created = Array.head(
						yield* insertMissing([{ authentication, displayName }]),
					);
					if (Option.isSome(created)) {
						return created.value;
					}
					return yield* db
						.select({
							authenticationId: authentications.id,
							userId: users.id,
						})
						.from(authentications)
						.innerJoin(users, eq(authentications.userId, users.id))
						.where(
							and(
								eq(authentications.issuer, authentication.issuer),
								eq(authentications.subject, authentication.subject),
							),
						)
						.pipe(Effect.head);
				},
				Effect.catchTag(
					["EffectDrizzleQueryError", "SqlError", "NoSuchElementError"],
					(cause) => BackendError.make({ cause }),
				),
			),
			resolveByUserId: Effect.fn("AuthenticationRepository.resolveByUserId")(
				function* (userId) {
					return yield* db
						.select({
							issuer: authentications.issuer,
							subject: authentications.subject,
						})
						.from(authentications)
						.where(eq(authentications.userId, userId));
				},
				Effect.catchTag("EffectDrizzleQueryError", (cause) =>
					BackendError.make({ cause }),
				),
			),
		};
	}),
);
