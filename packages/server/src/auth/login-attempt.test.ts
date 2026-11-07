import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import type { LoginAttempt } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { ConfigProvider, Effect, Layer } from "effect";
import { TestClock } from "effect/testing";
import { afterEach, describe, expect, vi } from "vitest";

import {
	type LoginAttemptRepository,
	LoginAttemptRepositoryService,
} from "../services/repository/login-attempt/login-attempt-repository.ts";
import {
	BackendError,
	KeyTaken,
} from "../services/repository/repository-errors.ts";
import { consumeLoginAttempt, createLoginAttempt } from "./login-attempt.ts";

const create = vi.fn<LoginAttemptRepository["create"]>(() => Effect.void);
const consume = vi.fn<LoginAttemptRepository["consume"]>(
	() => Effect.succeedNone,
);
const deleteExpired = vi.fn<LoginAttemptRepository["deleteExpired"]>(
	() => Effect.void,
);

afterEach(() => {
	for (const mock of [create, consume, deleteExpired]) {
		mock.mockReset();
	}
});

const test = testLayer(
	Layer.mergeAll(
		Layer.succeed(LoginAttemptRepositoryService, {
			create,
			consume,
			deleteExpired,
		}),
		NodeCrypto.layer,
		ConfigProvider.layer(
			ConfigProvider.fromEnvRecord({ LOGIN_ATTEMPT_TTL: "5 minutes" }),
		),
	),
);

const loginAttempt: LoginAttempt = {
	provider: "dev",
	state: "abc123",
	returnTo: "/dashboard",
};

describe("createLoginAttempt", () => {
	test(
		"stores the login attempt under the returned key, expiring the configured TTL from now",
		Effect.gen(function* () {
			yield* TestClock.adjust("1 minute");
			const key = yield* createLoginAttempt(loginAttempt);
			expect(create).toHaveBeenCalledWith(key, loginAttempt, 360_000);
		}),
	);

	test(
		"stores the login attempt under a fresh key when the drawn key is taken",
		Effect.gen(function* () {
			create.mockReturnValueOnce(Effect.fail(KeyTaken.make()));
			const key = yield* createLoginAttempt(loginAttempt);
			const [taken, stored] = create.mock.calls;
			expect(create).toHaveBeenCalledTimes(2);
			expect(stored?.[0]).toBe(key);
			expect(taken?.[0]).not.toBe(key);
		}),
	);

	test(
		"fails after two retries that each drew a taken key",
		Effect.gen(function* () {
			create.mockReturnValue(Effect.fail(KeyTaken.make()));
			const error = yield* createLoginAttempt(loginAttempt).pipe(Effect.flip);
			expect(error).toStrictEqual(
				BackendError.make({ cause: KeyTaken.make() }),
			);
			expect(create).toHaveBeenCalledTimes(3);
		}),
	);

	test(
		"deletes the login attempts that expired by now",
		Effect.gen(function* () {
			yield* TestClock.adjust("1 minute");
			yield* createLoginAttempt(loginAttempt);
			expect(deleteExpired).toHaveBeenCalledWith(60_000);
		}),
	);
});

describe("consumeLoginAttempt", () => {
	test(
		"consumes the key as of the current time",
		Effect.gen(function* () {
			yield* TestClock.adjust("1 minute");
			yield* consumeLoginAttempt("key");
			expect(consume).toHaveBeenCalledWith("key", 60_000);
		}),
	);
});
