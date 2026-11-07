import { Layer } from "effect";

import { DrizzleSqliteDatabaseService } from "../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { DrizzleSqliteTransaction } from "../transaction/drizzle-sqlite-transaction.ts";
import { DrizzleSqliteAuthenticationRepository } from "./authentication/drizzle-sqlite-authentication-repository.ts";
import { DrizzleSqliteLoginAttemptRepository } from "./login-attempt/drizzle-sqlite-login-attempt-repository.ts";
import { DrizzleSqliteRoleRepository } from "./role/drizzle-sqlite-role-repository.ts";
import { DrizzleSqliteServiceAccountRepository } from "./service-account/drizzle-sqlite-service-account-repository.ts";
import { DrizzleSqliteSessionRepository } from "./session/drizzle-sqlite-session-repository.ts";
import { DrizzleSqliteUserRepository } from "./user/drizzle-sqlite-user-repository.ts";

export const DrizzleSqliteRepositories = Layer.mergeAll(
	DrizzleSqliteLoginAttemptRepository,
	DrizzleSqliteAuthenticationRepository,
	DrizzleSqliteSessionRepository,
	DrizzleSqliteRoleRepository,
	DrizzleSqliteServiceAccountRepository,
	DrizzleSqliteUserRepository,
	DrizzleSqliteTransaction,
).pipe(Layer.provide(DrizzleSqliteDatabaseService.layer));
