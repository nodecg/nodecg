import type { LoginAttempt } from "@nodecg-next/internal";
import { Context, type Effect, type Option } from "effect";

import type { BackendError, KeyTaken } from "../repository-errors.ts";

export interface LoginAttemptRepository {
	readonly create: (
		key: string,
		loginAttempt: LoginAttempt,
		expiresAt: number,
	) => Effect.Effect<void, KeyTaken | BackendError>;

	readonly consume: (
		key: string,
		now: number,
	) => Effect.Effect<Option.Option<LoginAttempt>, BackendError>;

	readonly deleteExpired: (now: number) => Effect.Effect<void, BackendError>;
}

export class LoginAttemptRepositoryService extends Context.Service<
	LoginAttemptRepositoryService,
	LoginAttemptRepository
>()("LoginAttemptRepository") {}
