import type { LoginAttempt } from "@nodecg-next/internal";
import { and, eq, gt, lte } from "drizzle-orm";
import { Array, Effect, Layer, Option } from "effect";

import { DrizzleSqliteDatabaseService } from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { loginAttempts } from "../../database/drizzle-sqlite/tables.ts";
import { BackendError, KeyTaken } from "../repository-errors.ts";
import { LoginAttemptRepositoryService } from "./login-attempt-repository.ts";

export const DrizzleSqliteLoginAttemptRepository = Layer.effect(
	LoginAttemptRepositoryService,
	Effect.gen(function* () {
		const db = yield* DrizzleSqliteDatabaseService;

		const create = Effect.fn("LoginAttemptRepository.create")(
			function* (
				key: string,
				{ provider, state, codeVerifier, nonce, returnTo }: LoginAttempt,
				expiresAt: number,
			) {
				const inserted = yield* db
					.insert(loginAttempts)
					.values({
						key,
						provider,
						state,
						codeVerifier,
						nonce,
						returnTo,
						expiresAt,
					})
					.onConflictDoNothing({ target: loginAttempts.key })
					.returning({ key: loginAttempts.key });
				if (inserted.length === 0) {
					return yield* KeyTaken.make();
				}
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		const consume = Effect.fn("LoginAttemptRepository.consume")(
			function* (key: string, now: number) {
				const rows = yield* db
					.delete(loginAttempts)
					.where(
						and(eq(loginAttempts.key, key), gt(loginAttempts.expiresAt, now)),
					)
					.returning();
				return Array.head(rows).pipe(
					Option.map(({ provider, state, codeVerifier, nonce, returnTo }) => ({
						provider,
						state,
						codeVerifier: codeVerifier ?? undefined,
						nonce: nonce ?? undefined,
						returnTo: returnTo ?? undefined,
					})),
				);
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		const deleteExpired = Effect.fn("LoginAttemptRepository.deleteExpired")(
			function* (now: number) {
				yield* db
					.delete(loginAttempts)
					.where(lte(loginAttempts.expiresAt, now));
			},
			Effect.catchTag("EffectDrizzleQueryError", (cause) =>
				BackendError.make({ cause }),
			),
		);

		return { create, consume, deleteExpired };
	}),
);
