import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { testLayer } from "@nodecg-private/test-utils";
import {
	AuthenticationId,
	RoleName,
	UserId,
	UserSessionId,
} from "@nodecg/internal";
import { eq } from "drizzle-orm";
import {
	Array,
	ConfigProvider,
	Effect,
	FileSystem,
	Layer,
	Path,
	Schema,
} from "effect";
import { Reactivity } from "effect/reactivity";
import { TestConsole } from "effect/testing";
import { assert, describe, expect, vi } from "vitest";

import {
	DrizzleSqliteDatabaseService,
	makeQueryInChunks,
	MigrationsNotFound,
} from "./drizzle-sqlite-database.ts";
import {
	AccountId,
	accounts,
	authentications,
	globalRoleGrants,
	loginAttempts,
	roleGrants,
	sessions,
	users,
} from "./tables.ts";

const test = testLayer(
	Layer.mergeAll(NodeFileSystem.layer, NodePath.layer, Reactivity.layer),
);

describe("make", () => {
	test(
		"keeps what was stored in a file across reopening it",
		Effect.gen(function* () {
			const fs = yield* FileSystem.FileSystem;
			const path = yield* Path.Path;
			const file = path.join(
				yield* fs.makeTempDirectoryScoped(),
				"nodecg.sqlite3",
			);
			const row = {
				key: "k",
				provider: "dev",
				state: "s",
				codeVerifier: null,
				nonce: null,
				returnTo: null,
				expiresAt: 1000,
			};
			const first = yield* DrizzleSqliteDatabaseService.make(file);
			yield* first.insert(loginAttempts).values(row);
			const second = yield* DrizzleSqliteDatabaseService.make(file);

			expect(
				yield* second
					.select()
					.from(loginAttempts)
					.where(eq(loginAttempts.key, "k")),
			).toStrictEqual([row]);
		}),
	);

	test(
		"deletes an account's user, authentications and sessions along with the account",
		Effect.gen(function* () {
			const db = yield* DrizzleSqliteDatabaseService.make(":memory:");
			const accountId = AccountId.make("1");
			const userId = UserId.make("2");
			const authenticationId = AuthenticationId.make("3");
			yield* db
				.insert(accounts)
				.values({ id: accountId, displayName: "Alice", createdAt: 0 });
			yield* db.insert(users).values({ id: userId, accountId });
			yield* db.insert(authentications).values({
				id: authenticationId,
				userId,
				issuer: "dev",
				subject: "alice",
			});
			yield* db.insert(sessions).values({
				id: UserSessionId.make("4"),
				authenticationId,
				expiresAt: 1000,
			});

			yield* db.delete(accounts).where(eq(accounts.id, accountId));

			expect(yield* db.select().from(users)).toStrictEqual([]);
			expect(yield* db.select().from(authentications)).toStrictEqual([]);
			expect(yield* db.select().from(sessions)).toStrictEqual([]);
		}),
	);

	test(
		"deletes an account's role grants along with the account",
		Effect.gen(function* () {
			const db = yield* DrizzleSqliteDatabaseService.make(":memory:");
			const alice = AccountId.make("1");
			const bob = AccountId.make("2");
			const viewer = RoleName.make("viewer");
			yield* db.insert(accounts).values([
				{ id: alice, displayName: "Alice", createdAt: 0 },
				{ id: bob, displayName: "Bob", createdAt: 0 },
			]);
			yield* db.insert(roleGrants).values([
				{ accountId: alice, namespace: "show", roleName: viewer },
				{ accountId: bob, namespace: "show", roleName: viewer },
			]);
			yield* db.insert(globalRoleGrants).values([
				{ accountId: alice, roleName: "admin" },
				{ accountId: bob, roleName: "admin" },
			]);

			yield* db.delete(accounts).where(eq(accounts.id, alice));

			const roleRows = yield* db.select().from(roleGrants);
			expect(roleRows).toStrictEqual([
				{ accountId: bob, namespace: "show", roleName: viewer },
			]);
			const globalRoleRows = yield* db.select().from(globalRoleGrants);
			expect(globalRoleRows).toStrictEqual([
				{ accountId: bob, roleName: "admin" },
			]);
		}),
	);

	test(
		"fails with MigrationsNotFound when no package holds the server",
		Effect.gen(function* () {
			const fs = yield* FileSystem.FileSystem;
			const path = yield* Path.Path;

			const error = yield* DrizzleSqliteDatabaseService.make(":memory:").pipe(
				Effect.provideService(FileSystem.FileSystem, {
					...fs,
					exists: () => Effect.succeed(false),
				}),
				Effect.flip,
			);

			assert(Schema.is(MigrationsNotFound)(error));
			expect(error).toMatchObject({
				from: yield* path.fromFileUrl(new URL(".", import.meta.url)),
			});
		}),
	);
});

describe("layer", () => {
	test(
		"opens nodecg.sqlite3 in the data directory, creating the directory",
		Effect.gen(function* () {
			const fs = yield* FileSystem.FileSystem;
			const path = yield* Path.Path;
			const dataDir = path.join(yield* fs.makeTempDirectoryScoped(), "data");

			yield* Layer.build(
				DrizzleSqliteDatabaseService.layer.pipe(
					Layer.provide(
						ConfigProvider.layer(
							ConfigProvider.fromEnvRecord({ DATA_DIR: dataDir }),
						),
					),
				),
			);

			expect(yield* fs.exists(path.join(dataDir, "nodecg.sqlite3"))).toBe(true);
			expect(yield* TestConsole.logLines).toContain(
				`Storing system data in ${path.join(dataDir, "nodecg.sqlite3")}`,
			);
		}),
	);
});

describe("makeQueryInChunks", () => {
	test(
		"splits rows by the variable limit SQLite was compiled with",
		Effect.gen(function* () {
			const db = yield* DrizzleSqliteDatabaseService.make(":memory:");
			const queryInChunks = yield* makeQueryInChunks.pipe(
				Effect.provideService(DrizzleSqliteDatabaseService, db),
			);
			const rows = Array.makeBy(16_384, (id) => ({ id, name: "row" }));
			const query = vi.fn<
				(
					chunk: ReadonlyArray<{ id: number; name: string }>,
				) => Effect.Effect<void>
			>(() => Effect.void);

			yield* queryInChunks(rows, query);

			expect(query.mock.calls.map(([chunk]) => chunk.length)).toStrictEqual([
				16_383, 1,
			]);
		}),
	);

	test(
		"runs no query without rows",
		Effect.gen(function* () {
			const db = yield* DrizzleSqliteDatabaseService.make(":memory:");
			const queryInChunks = yield* makeQueryInChunks.pipe(
				Effect.provideService(DrizzleSqliteDatabaseService, db),
			);

			const query = vi.fn(() => Effect.void);

			yield* queryInChunks([], query);

			expect(query).not.toHaveBeenCalled();
		}),
	);
});
