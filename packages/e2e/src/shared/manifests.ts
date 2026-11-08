import { defineNamespace, extendNamespace, jsonSchema } from "@nodecg/core";
import { Schema } from "effect";
import { z } from "zod";

const everyoneRead = { read: { everyone: "allow" } } as const;
const everyoneReadWrite = {
	read: { everyone: "allow" },
	write: { everyone: "allow" },
} as const;
const everyoneWrite = { write: { everyone: "allow" } } as const;

export const fixtureManifest = defineNamespace("e2e", {
	roles: {
		producer: { permission: ["replicant-write"] },
		viewer: { permission: [] },
	},
	replicant: {
		count: { schema: Schema.Finite, permission: everyoneRead },
		scoreboard: {
			schema: z.object({ home: z.number(), away: z.number() }),
			permission: everyoneReadWrite,
		},
		tallies: {
			schema: Schema.Record(Schema.String, Schema.Finite),
			permission: everyoneReadWrite,
		},
		roster: {
			schema: jsonSchema({
				type: "array",
				items: {
					type: "object",
					properties: { id: { type: "string" }, score: { type: "number" } },
					required: ["id", "score"],
					additionalProperties: false,
				},
			}),
			permission: everyoneReadWrite,
		},
		mirrorSource: { schema: Schema.Finite, permission: everyoneReadWrite },
		mirror: { schema: Schema.Finite, permission: everyoneRead },
		label: { schema: Schema.String, permission: everyoneRead },
		secret: { schema: Schema.String, permission: { write: { allow: [] } } },
		producerOnly: {
			schema: Schema.String,
			permission: { read: { allow: ["producer"] } },
		},
		membersOnly: {
			schema: Schema.String,
			permission: { read: { member: "allow" } },
		},
	},
	computed: {
		doubledCount: { schema: Schema.Finite, permission: everyoneRead },
		summary: { schema: Schema.String, permission: everyoneRead },
	},
	topic: {
		chat: { schema: Schema.String, permission: everyoneReadWrite },
	},
	rpc: {
		echo: {
			schema: { request: Schema.String, response: Schema.String },
			permission: everyoneWrite,
		},
		bump: {
			schema: { request: Schema.Finite, response: Schema.Finite },
			permission: everyoneWrite,
		},
	},
});

export const baseManifest = defineNamespace("e2e-extend", {
	roles: {
		producer: { permission: ["replicant-write"] },
	},
	replicant: {
		score: { schema: Schema.Finite, permission: everyoneRead },
	},
});

export const extendedManifest = extendNamespace(baseManifest, {
	replicant: {
		bonus: { schema: Schema.Finite, permission: everyoneRead },
	},
	computed: {
		total: { schema: Schema.Finite, permission: everyoneRead },
	},
});

export const chainManifest = defineNamespace("e2e-chain", {
	replicant: {
		points: { schema: Schema.Finite, permission: everyoneReadWrite },
		target: { schema: Schema.Finite, permission: everyoneReadWrite },
		denominator: { schema: Schema.Finite, permission: everyoneReadWrite },
	},
	computed: {
		lead: { schema: Schema.Finite, permission: everyoneRead },
		status: { schema: Schema.String, permission: everyoneRead },
		reciprocal: { schema: Schema.Finite, permission: everyoneRead },
	},
});

export const crossManifest = defineNamespace("e2e-cross", {
	replicant: {
		factor: { schema: Schema.Finite, permission: everyoneRead },
	},
	computed: {
		scaledScore: { schema: Schema.Finite, permission: everyoneRead },
	},
	rpc: {
		addScore: {
			schema: { request: Schema.Finite, response: Schema.Finite },
			permission: everyoneWrite,
		},
	},
	children: { extended: extendedManifest },
});
