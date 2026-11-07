import { defineNamespace } from "@nodecg-next/core";
import { tickerManifest } from "@nodecg/example-plugin-ticker";
import { timeManifest } from "@nodecg/example-plugin-time";
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
