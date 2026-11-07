import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { type Authentication, UserId } from "@nodecg-next/internal";
import { testLayer } from "@nodecg-next/test-utils";
import { eq, sql } from "drizzle-orm";
import { Effect, Layer, Schema } from "effect";
import { SecureRandom } from "effect/crypto";
import { Reactivity } from "effect/reactivity";
import { TestClock } from "effect/testing";
import { afterEach, assert, describe, expect, vi } from "vitest";

import { DrizzleSqliteDatabaseService } from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import {
	accounts,
	authentications,
	users,
} from "../../database/drizzle-sqlite/tables.ts";
import { BackendError } from "../repository-errors.ts";
import { DrizzleSqliteSessionRepository } from "../session/drizzle-sqlite-session-repository.ts";
import { AuthenticationRepositoryService } from "./authentication-repository.ts";
import { DrizzleSqliteAuthenticationRepository } from "./drizzle-sqlite-authentication-repository.ts";

const random = SecureRandom.make((size) =>
	crypto.getRandomValues(new Uint8Array(size)),
);
const uuidV7 = vi.spyOn(random, "uuidV7");

afterEach(() => {
	uuidV7.mockReset();
});

const test = testLayer(
	Layer.mergeAll(
		DrizzleSqliteAuthenticationRepository,
		DrizzleSqliteSessionRepository,
	).pipe(
		Layer.provideMerge(
			Layer.effect(
				DrizzleSqliteDatabaseService,
				DrizzleSqliteDatabaseService.make(":memory:"),
			),
		),
		Layer.provide(
			Layer.mergeAll(
				NodeFileSystem.layer,
				NodePath.layer,
				Layer.succeed(SecureRandom.SecureRandom, random),
				Reactivity.layer,
			),
		),
	),
);

const alice: Authentication = { issuer: "dev", subject: "alice" };

const bob: Authentication = { issuer: "dev", subject: "bob" };

describe("findOrCreateAuthentication", () => {
	test(
		"creates a user and an account under the given name on its first login",
		Effect.gen(function* () {
			const repository = yield* AuthenticationRepositoryService;
			const db = yield* DrizzleSqliteDatabaseService;
			yield* TestClock.setTime(1000);

			const created = yield* repository.findOrCreateAuthentication(
				alice,
				"Alice",
			);

			const account = yield* db.select().from(accounts).pipe(Effect.head);
			const user = yield* db.select().from(users).pipe(Effect.head);
			const authentication = yield* db
				.select()
				.from(authentications)
				.pipe(Effect.head);
			expect(created).toStrictEqual({
				authenticationId: authentication.id,
				userId: user.id,
			});
			expect(account).toStrictEqual({
				id: account.id,
				displayName: "Alice",
				createdAt: 1000,
			});
			expect(user).toStrictEqual({ id: user.id, accountId: account.id });
			expect(authentication).toStrictEqual({
				id: authentication.id,
				userId: user.id,
				issuer: "dev",
				subject: "alice",
			});
		}),
	);

	test(
		"returns the same authentication on a later login, keeping the account's name",
		Effect.gen(function* () {
			const repository = yield* AuthenticationRepositoryService;
			const db = yield* DrizzleSqliteDatabaseService;

			yield* TestClock.setTime(1000);
			const first = yield* repository.findOrCreateAuthentication(
				alice,
				"Alice",
			);
			yield* TestClock.setTime(2000);
			const second = yield* repository.findOrCreateAuthentication(
				alice,
				"Alice Liddell",
			);

			expect(second).toStrictEqual(first);
			expect(
				yield* db
					.select({
						displayName: accounts.displayName,
						createdAt: accounts.createdAt,
					})
					.from(accounts),
			).toStrictEqual([{ displayName: "Alice", createdAt: 1000 }]);
		}),
	);

	test(
		"gives another subject of the same issuer its own account",
		Effect.gen(function* () {
			const repository = yield* AuthenticationRepositoryService;
			const db = yield* DrizzleSqliteDatabaseService;

			const created = yield* repository.findOrCreateAuthentication(
				alice,
				"Alice",
			);
			const other = yield* repository.findOrCreateAuthentication(bob, "Bob");

			expect(other.userId).not.toBe(created.userId);
			expect(
				(yield* db.select({ displayName: accounts.displayName }).from(accounts))
					.map(({ displayName }) => displayName)
					.toSorted(),
			).toStrictEqual(["Alice", "Bob"]);
		}),
	);

	test(
		"retries a first login from scratch when its drawn user id is taken",
		Effect.gen(function* () {
			const repository = yield* AuthenticationRepositoryService;
			const db = yield* DrizzleSqliteDatabaseService;
			uuidV7
				.mockReturnValueOnce(Effect.succeed("alice-authentication"))
				.mockReturnValueOnce(Effect.succeed("taken"));
			const aliceIds = yield* repository.findOrCreateAuthentication(
				alice,
				"Alice",
			);
			uuidV7
				.mockReturnValueOnce(Effect.succeed("bob-authentication"))
				.mockReturnValueOnce(Effect.succeed("taken"));

			const bobIds = yield* repository.findOrCreateAuthentication(bob, "Bob");

			// 3 ids times 3 attempts
			expect(uuidV7).toHaveBeenCalledTimes(9);
			const userRows = yield* db
				.select({
					userId: users.id,
					displayName: accounts.displayName,
					createdAt: accounts.createdAt,
				})
				.from(users)
				.innerJoin(accounts, eq(accounts.id, users.accountId))
				.orderBy(accounts.displayName);
			expect(userRows).toStrictEqual([
				{ userId: aliceIds.userId, displayName: "Alice", createdAt: 0 },
				{ userId: bobIds.userId, displayName: "Bob", createdAt: 0 },
			]);
		}),
	);

	test(
		"fails with a backend error when the query fails",
		Effect.gen(function* () {
			const repository = yield* AuthenticationRepositoryService;
			const db = yield* DrizzleSqliteDatabaseService;
			yield* db.run(sql`drop table authentications`);

			const error = yield* repository
				.findOrCreateAuthentication(alice, "Alice")
				.pipe(Effect.flip);

			assert(Schema.is(BackendError)(error));
			expect(error.message).toContain("authentications");
		}),
	);
});

describe("resolveByUserId", () => {
	test(
		"resolves the authentications of the user only",
		Effect.gen(function* () {
			const repository = yield* AuthenticationRepositoryService;
			const { userId } = yield* repository.findOrCreateAuthentication(
				alice,
				"Alice",
			);
			yield* repository.findOrCreateAuthentication(bob, "Bob");

			const authentications = yield* repository.resolveByUserId(userId);
			expect(authentications).toStrictEqual([alice]);
		}),
	);

	test(
		"resolves nothing for an unknown user",
		Effect.gen(function* () {
			const repository = yield* AuthenticationRepositoryService;

			const authentications = yield* repository.resolveByUserId(
				UserId.make("missing"),
			);
			expect(authentications).toStrictEqual([]);
		}),
	);
});
