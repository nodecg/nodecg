import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { testLayer } from "@nodecg-private/test-utils";
import {
	Authentication,
	AuthenticationId,
	Role,
	RoleName,
	UserSessionId,
} from "@nodecg/internal";
import { DateTime, Effect, HashSet, Layer, Option, Schema } from "effect";
import { Reactivity } from "effect/reactivity";
import { TestClock } from "effect/testing";
import { assert, describe, expect } from "vitest";

import { DrizzleSqliteDatabaseService } from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { sessions } from "../../database/drizzle-sqlite/tables.ts";
import { AuthenticationRepositoryService } from "../authentication/authentication-repository.ts";
import { DrizzleSqliteAuthenticationRepository } from "../authentication/drizzle-sqlite-authentication-repository.ts";
import { BackendError, KeyTaken } from "../repository-errors.ts";
import { DrizzleSqliteUserRepository } from "../user/drizzle-sqlite-user-repository.ts";
import { UserRepositoryService } from "../user/user-repository.ts";
import { DrizzleSqliteSessionRepository } from "./drizzle-sqlite-session-repository.ts";
import { SessionRepositoryService } from "./session-repository.ts";

const test = testLayer(
	Layer.mergeAll(
		DrizzleSqliteSessionRepository,
		DrizzleSqliteAuthenticationRepository,
		DrizzleSqliteUserRepository,
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
				NodeCrypto.layer,
				Reactivity.layer,
			),
		),
	),
);

const first = UserSessionId.make("first");
const second = UserSessionId.make("second");

const logIn = Effect.gen(function* () {
	const authentications = yield* AuthenticationRepositoryService;
	const { authenticationId } =
		yield* authentications.findOrCreateAuthentication(
			{ issuer: "dev", subject: "alice" },
			"Alice",
		);
	return authenticationId;
});

const storedSessions = Effect.gen(function* () {
	const db = yield* DrizzleSqliteDatabaseService;
	return (yield* db.select().from(sessions)).toSorted((a, b) =>
		a.id.localeCompare(b.id),
	);
});

describe("create", () => {
	test(
		"stores a session under the given id for the authentication",
		Effect.gen(function* () {
			const repository = yield* SessionRepositoryService;
			const authentication = yield* logIn;
			const start = yield* DateTime.now;
			yield* repository.create(
				first,
				authentication,
				DateTime.addDuration(start, 1000),
			);
			expect(yield* storedSessions).toStrictEqual([
				{ id: first, authenticationId: authentication, expiresAt: 1000 },
			]);
		}),
	);

	test(
		"fails with KeyTaken and keeps the stored session when the id is taken",
		Effect.gen(function* () {
			const repository = yield* SessionRepositoryService;
			const authentication = yield* logIn;
			const start = yield* DateTime.now;
			yield* repository.create(
				first,
				authentication,
				DateTime.addDuration(start, 1000),
			);
			const error = yield* repository
				.create(first, authentication, DateTime.addDuration(start, 2000))
				.pipe(Effect.flip);
			expect(error).toStrictEqual(KeyTaken.make());
			expect(yield* storedSessions).toStrictEqual([
				{ id: first, authenticationId: authentication, expiresAt: 1000 },
			]);
		}),
	);

	test(
		"fails with a backend error for an authentication that does not exist",
		Effect.gen(function* () {
			const repository = yield* SessionRepositoryService;
			const error = yield* repository
				.create(first, AuthenticationId.make("ghost"), yield* DateTime.now)
				.pipe(Effect.flip);
			assert(Schema.is(BackendError)(error));
			expect(error.message).toContain("FOREIGN KEY");
		}),
	);
});

describe("resolve", () => {
	const alice = Authentication.make({ issuer: "dev", subject: "alice" });
	const bob = Authentication.make({ issuer: "dev", subject: "bob" });
	const viewer = Role.make({
		namespace: "show",
		name: RoleName.make("viewer"),
	});
	const producer = Role.make({
		namespace: "show",
		name: RoleName.make("producer"),
	});

	test(
		"resolves a live session to its authentication and its user",
		Effect.gen(function* () {
			const repository = yield* SessionRepositoryService;
			const authentications = yield* AuthenticationRepositoryService;
			const users = yield* UserRepositoryService;
			const start = yield* DateTime.now;

			const aliceIds = yield* authentications.findOrCreateAuthentication(
				alice,
				"Alice",
			);
			yield* users.grantRoles(aliceIds.userId, HashSet.make(viewer));
			yield* users.grantGlobalRole(aliceIds.userId, "admin");

			const bobIds = yield* authentications.findOrCreateAuthentication(
				bob,
				"Bob",
			);
			yield* users.grantRoles(bobIds.userId, HashSet.make(producer));

			yield* repository.create(
				first,
				aliceIds.authenticationId,
				DateTime.addDuration(start, 1000),
			);
			yield* TestClock.setTime(999);

			expect(yield* repository.resolve(first)).toStrictEqual(
				Option.some({
					authentication: alice,
					user: {
						id: aliceIds.userId,
						displayName: "Alice",
						authentications: [alice],
						roles: [viewer],
						globalRoles: ["admin"],
					},
				}),
			);
		}),
	);

	test(
		"treats a session as absent from the moment it expires",
		Effect.gen(function* () {
			const repository = yield* SessionRepositoryService;
			const authentication = yield* logIn;
			const start = yield* DateTime.now;
			yield* repository.create(
				first,
				authentication,
				DateTime.addDuration(start, 1000),
			);
			yield* TestClock.setTime(1000);

			expect(yield* repository.resolve(first)).toStrictEqual(Option.none());
		}),
	);

	test(
		"treats an unknown session as absent",
		Effect.gen(function* () {
			const repository = yield* SessionRepositoryService;

			expect(yield* repository.resolve(first)).toStrictEqual(Option.none());
		}),
	);
});

describe("refreshTTL", () => {
	test(
		"moves the expiry of a session that expires before the given time",
		Effect.gen(function* () {
			const repository = yield* SessionRepositoryService;
			const authentication = yield* logIn;
			const start = yield* DateTime.now;
			yield* repository.create(
				first,
				authentication,
				DateTime.addDuration(start, 1000),
			);
			yield* TestClock.setTime(999);

			const isRenewed = yield* repository.refreshTTL(
				first,
				DateTime.addDuration(start, 5000),
				DateTime.addDuration(start, 2000),
			);

			expect(isRenewed).toBe(true);
			expect(yield* storedSessions).toStrictEqual([
				{ id: first, authenticationId: authentication, expiresAt: 5000 },
			]);
		}),
	);

	test(
		"leaves a session that does not expire before the given time",
		Effect.gen(function* () {
			const repository = yield* SessionRepositoryService;
			const authentication = yield* logIn;
			const start = yield* DateTime.now;
			yield* repository.create(
				first,
				authentication,
				DateTime.addDuration(start, 1000),
			);
			yield* TestClock.setTime(999);

			const isRenewed = yield* repository.refreshTTL(
				first,
				DateTime.addDuration(start, 5000),
				DateTime.addDuration(start, 500),
			);

			expect(isRenewed).toBe(false);
			expect(yield* storedSessions).toStrictEqual([
				{ id: first, authenticationId: authentication, expiresAt: 1000 },
			]);
		}),
	);

	test(
		"leaves a session that expired by now as it is",
		Effect.gen(function* () {
			const repository = yield* SessionRepositoryService;
			const authentication = yield* logIn;
			const start = yield* DateTime.now;
			yield* repository.create(
				first,
				authentication,
				DateTime.addDuration(start, 1000),
			);
			yield* TestClock.setTime(1000);

			const isRenewed = yield* repository.refreshTTL(
				first,
				DateTime.addDuration(start, 5000),
				DateTime.addDuration(start, 6000),
			);

			expect(isRenewed).toBe(false);
			expect(yield* storedSessions).toStrictEqual([
				{ id: first, authenticationId: authentication, expiresAt: 1000 },
			]);
		}),
	);
});

describe("revoke", () => {
	test(
		"deletes only the given session",
		Effect.gen(function* () {
			const repository = yield* SessionRepositoryService;
			const authentication = yield* logIn;
			const expiresAt = DateTime.addDuration(yield* DateTime.now, 1000);
			yield* repository.create(first, authentication, expiresAt);
			yield* repository.create(second, authentication, expiresAt);
			yield* repository.revoke(first);
			expect(yield* storedSessions).toStrictEqual([
				{ id: second, authenticationId: authentication, expiresAt: 1000 },
			]);
		}),
	);
});
