import { defineNamespace } from "@nodecg/core";
import { Schema } from "effect";

import { counterManifest, settingsManifest } from "./library/manifest.ts";

export const rootManifest = defineNamespace("counter-example", {
	roles: {
		operator: {
			permission: ["replicant-write"],
			linkRoles: (children) => [children.counter.roles.operator],
		},
	},
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
	children: { counter: counterManifest, settings: settingsManifest },
});
