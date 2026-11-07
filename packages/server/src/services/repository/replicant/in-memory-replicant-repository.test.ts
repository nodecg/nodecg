import { testLayer } from "@nodecg-next/test-utils";
import { Effect } from "effect";
import { describe, expect } from "vitest";

import { InMemoryReplicantRepository } from "./in-memory-replicant-repository.ts";
import { ReplicantRepositoryService } from "./replicant-repository.ts";

const test = testLayer(InMemoryReplicantRepository);

describe("read", () => {
	test(
		"fails with ReplicantNotFound on a missing key",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			const error = yield* repository.read("ns", "missing").pipe(Effect.flip);
			expect(error._tag).toBe("ReplicantNotFound");
		}),
	);
});

describe("write", () => {
	test(
		"stores new values that read returns",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			yield* repository.write("ns", "a", 1);
			yield* repository.write("ns", "b", "two");
			expect(yield* repository.read("ns", "a")).toBe(1);
			expect(yield* repository.read("ns", "b")).toBe("two");
		}),
	);

	test(
		"overwrites an existing value",
		Effect.gen(function* () {
			const repository = yield* ReplicantRepositoryService;
			yield* repository.write("ns", "a", 1);
			yield* repository.write("ns", "a", 2);
			expect(yield* repository.read("ns", "a")).toBe(2);
		}),
	);
});
