import { Effect, Layer } from "effect";

import { DrizzleSqliteDatabaseService } from "../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { BackendError } from "../repository/repository-errors.ts";
import { TransactionService } from "./transaction.ts";

export const DrizzleSqliteTransaction = Layer.effect(
	TransactionService,
	Effect.gen(function* () {
		const db = yield* DrizzleSqliteDatabaseService;
		return {
			wrap: (effect) =>
				db
					.transaction(() => effect)
					.pipe(
						Effect.catchTag("SqlError", (cause) =>
							BackendError.make({ cause }),
						),
					),
		};
	}),
);
