import type { NamespacePath } from "@nodecg/internal";
import { Effect, Layer, MutableHashMap, Option, type Schema } from "effect";

import {
	ReplicantNotFound,
	ReplicantRepositoryService,
} from "./replicant-repository.ts";

export const InMemoryReplicantRepository = Layer.sync(
	ReplicantRepositoryService,
	() => {
		const values = MutableHashMap.empty<
			{ readonly namespace: NamespacePath; readonly name: string },
			Schema.Json
		>();

		const read = Effect.fn(function* (namespace: NamespacePath, name: string) {
			const value = MutableHashMap.get(values, { namespace, name });
			if (Option.isNone(value)) {
				return yield* ReplicantNotFound.make({ namespace, name });
			}
			return value.value;
		});

		const write = (
			namespace: NamespacePath,
			name: string,
			value: Schema.Json,
		) =>
			Effect.sync(() => {
				MutableHashMap.set(values, { namespace, name }, value);
			});

		return { read, write };
	},
);
