import { defineNamespace } from "@nodecg-next/core";
import { Schema } from "effect";

export const timeManifest = defineNamespace("time", {
	replicant: {
		time: {
			schema: Schema.Finite,
			permission: { read: { everyone: "allow" } },
			persistent: false,
		},
	},
});
