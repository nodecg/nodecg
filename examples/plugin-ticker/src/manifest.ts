import { defineNamespace } from "@nodecg-next/core";
import { Schema } from "effect";

const everyoneWrite = { write: { everyone: "allow" } } as const;

export const tickerManifest = defineNamespace("ticker", {
	replicant: {
		messages: {
			schema: Schema.Array(
				Schema.Struct({ text: Schema.String, postedAt: Schema.Finite }),
			),
			permission: { read: { everyone: "allow" }, ...everyoneWrite },
		},
	},
	rpc: {
		post: {
			schema: { request: Schema.String, response: Schema.Finite },
			permission: everyoneWrite,
		},
		clear: {
			schema: { request: Schema.Null, response: Schema.Finite },
			permission: everyoneWrite,
		},
	},
});
