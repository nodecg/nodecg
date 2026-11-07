import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import type { LoginAttempt } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { sql } from "drizzle-orm";
import { Effect, Layer, Option, Schema } from "effect";
import { Reactivity } from "effect/reactivity";
import { assert, describe, expect } from "vitest";

import { DrizzleSqliteDatabaseService } from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { BackendError, KeyTaken } from "../repository-errors.ts";
import { DrizzleSqliteLoginAttemptRepository } from "./drizzle-sqlite-login-attempt-repository.ts";
import { LoginAttemptRepositoryService } from "./login-attempt-repository.ts";

const test = testLayer(
	DrizzleSqliteLoginAttemptRepository.pipe(
		Layer.provideMerge(
			Layer.effect(
				DrizzleSqliteDatabaseService,
				DrizzleSqliteDatabaseService.make(":memory:"),
			),
		),
		Layer.provide(
			Layer.mergeAll(NodeFileSystem.layer, NodePath.layer, Reactivity.layer),
		),
	),
);

const loginAttempt: LoginAttempt = {
	provider: "dev",
	state: "abc123",
	codeVerifier: "verifier",
	nonce: "nonce",
	returnTo: "/dashboard",
};

describe("LoginAttemptRepository", () => {
	test(
		"consumes a created login attempt",
		Effect.gen(function* () {
			const repository = yield* LoginAttemptRepositoryService;
			yield* repository.create("k", loginAttempt, 1000);
			expect(yield* repository.consume("k", 0)).toStrictEqual(
				Option.some(loginAttempt),
			);
		}),
	);

	test(
		"returns undefined for the optional fields a login attempt was created without",
		Effect.gen(function* () {
			const repository = yield* LoginAttemptRepositoryService;
			yield* repository.create("k", { provider: "dev", state: "s" }, 1000);
			expect(yield* repository.consume("k", 0)).toStrictEqual(
				Option.some({
					provider: "dev",
					state: "s",
					codeVerifier: undefined,
					nonce: undefined,
					returnTo: undefined,
				}),
			);
		}),
	);

	test(
		"stores a login attempt under the given key even when it carries its own key",
		Effect.gen(function* () {
			const repository = yield* LoginAttemptRepositoryService;
			const withKey = { ...loginAttempt, key: "other" };
			yield* repository.create("k", withKey, 1000);
			expect(yield* repository.consume("k", 0)).toStrictEqual(
				Option.some(loginAttempt),
			);
		}),
	);

	test(
		"fails with KeyTaken and keeps the stored login attempt when the key is taken",
		Effect.gen(function* () {
			const repository = yield* LoginAttemptRepositoryService;
			yield* repository.create("k", loginAttempt, 1000);
			const error = yield* repository
				.create("k", { provider: "other", state: "s" }, 2000)
				.pipe(Effect.flip);
			expect(error).toStrictEqual(KeyTaken.make());
			expect(yield* repository.consume("k", 0)).toStrictEqual(
				Option.some(loginAttempt),
			);
		}),
	);

	test(
		"treats an unknown key as absent",
		Effect.gen(function* () {
			const repository = yield* LoginAttemptRepositoryService;
			expect(yield* repository.consume("ghost", 0)).toStrictEqual(
				Option.none(),
			);
		}),
	);

	test(
		"treats a login attempt as absent from the moment it expires",
		Effect.gen(function* () {
			const repository = yield* LoginAttemptRepositoryService;
			yield* repository.create("k", loginAttempt, 1000);
			expect(yield* repository.consume("k", 1000)).toStrictEqual(Option.none());
			expect(yield* repository.consume("k", 999)).toStrictEqual(
				Option.some(loginAttempt),
			);
		}),
	);

	test(
		"treats a consumed login attempt as absent",
		Effect.gen(function* () {
			const repository = yield* LoginAttemptRepositoryService;
			yield* repository.create("k", loginAttempt, 1000);
			yield* repository.consume("k", 0);
			expect(yield* repository.consume("k", 0)).toStrictEqual(Option.none());
		}),
	);

	test(
		"deletes the login attempts that expire at or before the given time",
		Effect.gen(function* () {
			const repository = yield* LoginAttemptRepositoryService;
			yield* repository.create("expired", loginAttempt, 1000);
			yield* repository.create("live", loginAttempt, 1001);
			yield* repository.deleteExpired(1000);
			expect(yield* repository.consume("expired", 0)).toStrictEqual(
				Option.none(),
			);
			expect(yield* repository.consume("live", 0)).toStrictEqual(
				Option.some(loginAttempt),
			);
		}),
	);

	test(
		"fails with a backend error when the query fails",
		Effect.gen(function* () {
			const repository = yield* LoginAttemptRepositoryService;
			const db = yield* DrizzleSqliteDatabaseService;
			yield* db.run(sql`drop table login_attempts`);

			const error = yield* repository
				.create("k", loginAttempt, 1000)
				.pipe(Effect.flip);

			assert(Schema.is(BackendError)(error));
			expect(error.message).toContain("login_attempts");
		}),
	);
});
