import { Effect, Layer, type Schema } from "effect";

import {
	ReplicantNotFound,
	ReplicantRepositoryService,
} from "./replicant-repository.ts";

export const InMemoryReplicantRepository = Layer.sync(
	ReplicantRepositoryService,
	() => {
		const map = new Map<string, Map<string, Schema.Json>>();

		const read = (
			namespace: string,
			name: string,
		): Effect.Effect<Schema.Json, ReplicantNotFound> => {
			const value = map.get(namespace)?.get(name);
			// JavaScript `undefined` is not a valid JSON value, thus means value not defined
			if (typeof value === "undefined") {
				return new ReplicantNotFound({ namespace, name });
			}
			return Effect.succeed(value);
		};

		const write = (namespace: string, name: string, value: Schema.Json) =>
			Effect.sync(() => {
				const ns = map.get(namespace);
				if (ns) {
					ns.set(name, value);
				} else {
					map.set(namespace, new Map([[name, value]]));
				}
			});

		return {
			read,
			write,
		};
	},
);
