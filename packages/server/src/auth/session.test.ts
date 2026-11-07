import { createHash } from "node:crypto";

import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import {
	type Authentication,
	AuthenticationId,
	UserId,
} from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { ConfigProvider, DateTime, Effect, Layer } from "effect";
import { TestClock } from "effect/testing";
import { afterEach, describe, expect, vi } from "vitest";

import {
	type AuthenticationRepository,
	AuthenticationRepositoryService,
} from "../services/repository/authentication/authentication-repository.ts";
import {
	BackendError,
	KeyTaken,
} from "../services/repository/repository-errors.ts";
import {
	type SessionRepository,
	SessionRepositoryService,
} from "../services/repository/session/session-repository.ts";
import { TransactionService } from "../services/transaction/transaction.ts";
import { createSession } from "./session.ts";

const alice: Authentication = { issuer: "dev", subject: "alice" };
const aliceAuthId = AuthenticationId.make("alice");

const findOrCreateAuthentication = vi.fn<
	AuthenticationRepository["findOrCreateAuthentication"]
>(() =>
	Effect.succeed({
		authenticationId: aliceAuthId,
		userId: UserId.make("alice-user"),
	}),
);
const create = vi.fn<SessionRepository["create"]>(() => Effect.void);
const revoke = vi.fn<SessionRepository["revoke"]>(() => Effect.void);

afterEach(() => {
	for (const mock of [findOrCreateAuthentication, create, revoke]) {
		mock.mockReset();
	}
});

const test = testLayer(
	Layer.mergeAll(
		Layer.mock(AuthenticationRepositoryService)({ findOrCreateAuthentication }),
		Layer.mock(SessionRepositoryService)({ create, revoke }),
		Layer.succeed(TransactionService, { wrap: (effect) => effect }),
		NodeCrypto.layer,
		ConfigProvider.layer(
			ConfigProvider.fromEnvRecord({ SESSION_TTL: "1 hour" }),
		),
	),
);

const hashSessionToken = (token: string) =>
	createHash("sha256").update(token).digest("base64url");

describe("createSession", () => {
	test(
		"stores the session under the token's hash until the TTL runs out",
		Effect.gen(function* () {
			yield* TestClock.adjust("1 minute");
			const token = yield* createSession(alice, "Alice");
			const now = yield* DateTime.now;
			expect(findOrCreateAuthentication).toHaveBeenCalledWith(alice, "Alice");
			expect(create).toHaveBeenCalledWith(
				hashSessionToken(token),
				aliceAuthId,
				DateTime.addDuration(now, "1 hour"),
			);
		}),
	);

	test(
		"stores the session under a fresh token when the drawn one is taken",
		Effect.gen(function* () {
			create.mockReturnValueOnce(Effect.fail(KeyTaken.make()));
			const token = yield* createSession(alice, "Alice");
			const [taken, stored] = create.mock.calls;
			expect(create).toHaveBeenCalledTimes(2);
			expect(stored?.[0]).toBe(hashSessionToken(token));
			expect(taken?.[0]).not.toBe(hashSessionToken(token));
		}),
	);

	test(
		"fails after two retries that each drew a taken token",
		Effect.gen(function* () {
			create.mockReturnValue(Effect.fail(KeyTaken.make()));
			const error = yield* createSession(alice, "Alice").pipe(Effect.flip);
			expect(error).toStrictEqual(
				BackendError.make({ cause: KeyTaken.make() }),
			);
			expect(create).toHaveBeenCalledTimes(3);
		}),
	);

	test(
		"writes the authentication and the session in one transaction",
		Effect.gen(function* () {
			const begin = vi.fn();
			yield* createSession(alice, "Alice").pipe(
				Effect.provideService(TransactionService, {
					wrap: (effect) => {
						begin();
						return effect.pipe(
							Effect.andThen(BackendError.make({ cause: "rolled back" })),
						);
					},
				}),
				Effect.flip,
			);
			expect(begin).toHaveBeenCalledBefore(findOrCreateAuthentication);
			expect(create).toHaveBeenCalledOnce();
		}),
	);
});
