import { defineNamespace } from "@nodecg-next/core";
import { Schema } from "effect";

export const persistenceManifest = defineNamespace("e2e-persistence", {
	replicant: {
		live: {
			schema: Schema.Finite,
			permission: { write: { everyone: "allow" } },
			persistent: false,
		},
		score: {
			schema: Schema.Finite,
			permission: { write: { everyone: "allow" } },
		},
	},
});
