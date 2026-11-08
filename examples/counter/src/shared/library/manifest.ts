import { defineNamespace } from "@nodecg/core";
import { Schema } from "effect";

const everyoneRead = { read: { everyone: "allow" } } as const;
const everyoneReadWrite = {
	read: { everyone: "allow" },
	write: { everyone: "allow" },
} as const;
const everyoneWrite = { write: { everyone: "allow" } } as const;

export const counterManifest = defineNamespace("counter", {
	roles: {
		operator: { permission: ["replicant-write"] },
	},
	replicant: {
		count: { schema: Schema.Number, permission: everyoneRead },
	},
	topic: {
		cheer: { schema: Schema.String, permission: everyoneReadWrite },
	},
	rpc: {
		roll: {
			schema: { request: Schema.Number, response: Schema.Number },
			permission: everyoneWrite,
		},
	},
});

export const settingsManifest = defineNamespace("settings", {
	roles: {
		operator: { permission: ["replicant-write"] },
	},
	replicant: {
		title: { schema: Schema.String, permission: everyoneRead },
	},
});
