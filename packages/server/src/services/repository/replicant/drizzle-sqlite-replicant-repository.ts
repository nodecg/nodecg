import { Effect, Layer } from "effect";

import { DrizzleSqliteDatabaseService } from "../../database/drizzle-sqlite/drizzle-sqlite-database.ts";
import {
	ReplicantNotFound,
	ReplicantRepositoryService,
} from "./replicant-repository.ts";

export const DrizzleSqliteReplicantRepository = Layer.effect(
	ReplicantRepositoryService,
	Effect.gen(function* () {
		// @ts-expect-error
		const _db = yield* DrizzleSqliteDatabaseService;

		const read = Effect.fn("ReplicantRepository.read")(function* (
			namespace: string,
			name: string,
		) {
			// TODO
			return yield* ReplicantNotFound.make({ namespace, name });
		});

		const write = Effect.fn("ReplicantRepository.write")(function* () {
			// TODO
		});

		return { read, write };
	}),
);
