import type { LoginAttempt } from "@nodecg-next/internal";
import { Clock, Duration, Effect, Schema } from "effect";
import { SecureRandom } from "effect/crypto";
import { Base64Url } from "effect/encoding";

import { config } from "../server-config.ts";
import { LoginAttemptRepositoryService } from "../services/repository/login-attempt/login-attempt-repository.ts";
import {
	BackendError,
	KeyTaken,
} from "../services/repository/repository-errors.ts";

const insertLoginAttempt = Effect.fn("insertLoginAttempt")(
	function* (loginAttempt: LoginAttempt, expiresAt: number) {
		const random = yield* SecureRandom.SecureRandom;
		const repository = yield* LoginAttemptRepositoryService;
		const bytes = yield* random.randomBytes(32);
		const key = Base64Url.encode(bytes);
		yield* repository.create(key, loginAttempt, expiresAt);
		return key;
	},
	Effect.retry({ times: 2, while: Schema.is(KeyTaken) }),
	Effect.catchTag("KeyTaken", (cause) => BackendError.make({ cause })),
);

export const createLoginAttempt = Effect.fn("createLoginAttempt")(function* (
	loginAttempt: LoginAttempt,
) {
	const repository = yield* LoginAttemptRepositoryService;
	const ttl = yield* config.loginAttemptTtl;
	const now = yield* Clock.currentTimeMillis;
	yield* repository.deleteExpired(now);
	return yield* insertLoginAttempt(loginAttempt, now + Duration.toMillis(ttl));
});

export const consumeLoginAttempt = Effect.fn("consumeLoginAttempt")(function* (
	key: string,
) {
	const repository = yield* LoginAttemptRepositoryService;
	return yield* repository.consume(key, yield* Clock.currentTimeMillis);
});
