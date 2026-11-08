import { tickerManifest } from "@nodecg-private/example-plugin-ticker";
import { timeManifest } from "@nodecg-private/example-plugin-time";
import { defineNamespace } from "@nodecg/core";
import { Schema } from "effect";

export const showManifest = defineNamespace("show", {
	replicant: {
		title: {
			schema: Schema.String,
			permission: { read: { everyone: "allow" } },
		},
	},
	computed: {
		visibleMessages: {
			schema: Schema.Array(Schema.String),
			permission: { read: { everyone: "allow" } },
		},
	},
	children: { ticker: tickerManifest, time: timeManifest },
});
