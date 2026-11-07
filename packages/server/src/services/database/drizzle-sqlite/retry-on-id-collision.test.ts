import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { testLayer } from "@nodecg-next/test-utils";
import { sql } from "drizzle-orm";
import { EffectDrizzleQueryError } from "drizzle-orm/effect-core";
import { Effect, Layer } from "effect";
import { SecureRandom } from "effect/crypto";
import { Reactivity } from "effect/reactivity";
import { afterEach, describe, expect, vi } from "vitest";

import { DrizzleSqliteDatabaseService } from "./drizzle-sqlite-database.ts";
import { retryOnIdCollision } from "./retry-on-id-collision.ts";
import { AccountId, accounts } from "./tables.ts";

const nextId = vi.fn((): string => SecureRandom.uuidV4Unsafe());

afterEach(() => {
	nextId.mockReset();
});

const test = testLayer(
	Layer.effect(
		DrizzleSqliteDatabaseService,
		DrizzleSqliteDatabaseService.make(":memory:"),
	).pipe(
		Layer.provide(
			Layer.mergeAll(NodeFileSystem.layer, NodePath.layer, Reactivity.layer),
		),
	),
);

const insertAccount = Effect.fn(function* (displayName: string) {
	const db = yield* DrizzleSqliteDatabaseService;
	return yield* db
		.insert(accounts)
		.values({
			id: AccountId.make(nextId()),
			displayName,
			createdAt: 0,
		})
		.returning()
		.pipe(Effect.head);
}, retryOnIdCollision);

describe("retryOnIdCollision", () => {
	test(
		"inserts under a fresh id when the generated id is taken",
		Effect.gen(function* () {
			const db = yield* DrizzleSqliteDatabaseService;
			nextId.mockReturnValueOnce("taken");
			const alice = yield* insertAccount("Alice");
			nextId.mockReturnValueOnce("taken");

			const bob = yield* insertAccount("Bob");

			expect(bob.id).not.toBe(alice.id);
			const rows = yield* db
				.select()
				.from(accounts)
				.orderBy(accounts.displayName);
			expect(rows).toStrictEqual([
				{ id: alice.id, displayName: "Alice", createdAt: 0 },
				{ id: bob.id, displayName: "Bob", createdAt: 0 },
			]);
		}),
	);

	test(
		"fails after two retries that each drew a taken id",
		Effect.gen(function* () {
			nextId.mockReturnValueOnce("taken");
			yield* insertAccount("Alice");
			nextId.mockReset();
			nextId.mockImplementation(() => "taken");

			const error = yield* insertAccount("Bob").pipe(Effect.flip);

			expect(error).toBeInstanceOf(EffectDrizzleQueryError);
			expect(nextId).toHaveBeenCalledTimes(3);
		}),
	);

	test(
		"does not retry an insert that fails for another reason than a taken id",
		Effect.gen(function* () {
			const db = yield* DrizzleSqliteDatabaseService;
			yield* db.run(sql`drop table accounts`);

			const error = yield* insertAccount("Alice").pipe(Effect.flip);

			expect(error).toBeInstanceOf(EffectDrizzleQueryError);
			expect(nextId).toHaveBeenCalledOnce();
		}),
	);
});
