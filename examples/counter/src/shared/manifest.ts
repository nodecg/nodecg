import { defineNamespace, extendNamespace } from "@nodecg-next/core";
import { Schema } from "effect";

import { counterManifest, settingsManifest } from "./library/manifest.ts";

export const extendedCounterManifest = extendNamespace(counterManifest, {
	replicant: {
		step: {
			schema: Schema.Finite,
			permission: { read: { everyone: "allow" } },
		},
	},
	computed: {
		parity: {
			schema: Schema.Literals(["even", "odd"]),
			permission: { read: { everyone: "allow" } },
		},
		announcement: {
			schema: Schema.String,
			permission: { read: { everyone: "allow" } },
		},
	},
});

export const rootManifest = defineNamespace("counter-example", {
	children: { counter: extendedCounterManifest, settings: settingsManifest },
});
