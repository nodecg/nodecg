import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { testLayer } from "@nodecg-next/test-utils";
import { Effect, Layer, Schema } from "effect";
import { Reactivity } from "effect/reactivity";
import { describe, expect } from "vitest";

import { DrizzleSqliteDatabaseService } from "../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import { AccountId, accounts } from "../database/drizzle-sqlite/tables.ts";
import { DrizzleSqliteTransaction } from "./drizzle-sqlite-transaction.ts";
import { TransactionService } from "./transaction.ts";

const test = testLayer(
	DrizzleSqliteTransaction.pipe(
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

class Abort extends Schema.TaggedError<Abort>()("Abort", {}) {}

describe("wrap", () => {
	test(
		"undoes what the effect wrote and keeps its failure when it fails",
		Effect.gen(function* () {
			const tx = yield* TransactionService;
			const db = yield* DrizzleSqliteDatabaseService;
			const error = yield* tx
				.wrap(
					Effect.gen(function* () {
						yield* db.insert(accounts).values({
							id: AccountId.make("alice"),
							displayName: "Alice",
							createdAt: 0,
						});
						return yield* Abort.make({});
					}),
				)
				.pipe(Effect.flip);
			expect(error).toStrictEqual(Abort.make({}));
			expect(yield* db.select().from(accounts)).toStrictEqual([]);
		}),
	);
});
