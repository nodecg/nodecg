import { defineNamespace } from "@nodecg-next/core";
import { Schema } from "effect";

const everyone = {
	read: { everyone: "allow" },
	write: { everyone: "allow" },
} as const;

export const telemetryManifest = defineNamespace("telemetry", {
	replicant: { score: { schema: Schema.Finite, permission: everyone } },
	rpc: {
		endedSpans: {
			schema: {
				request: Schema.String,
				response: Schema.Array(
					Schema.Struct({
						root: Schema.Boolean,
						failed: Schema.Boolean,
						path: Schema.NullOr(Schema.String),
						query: Schema.NullOr(Schema.String),
					}),
				),
			},
			permission: { write: { everyone: "allow" } },
		},
		hasExport: {
			schema: { request: Schema.String, response: Schema.Boolean },
			permission: { write: { everyone: "allow" } },
		},
	},
});
