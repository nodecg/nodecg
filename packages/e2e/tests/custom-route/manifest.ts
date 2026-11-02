import { defineNamespace } from "@nodecg-next/core";
import { Schema } from "effect";

export const customRouteManifest = defineNamespace("e2e-custom-route", {
	replicant: {
		uploadedBytes: {
			schema: Schema.Finite,
			permission: { read: { everyone: "allow" } },
		},
	},
	customRoute: {
		upload: { post: { permission: { write: { everyone: "allow" } } } },
		stream: { get: { permission: { write: { everyone: "allow" } } } },
		hono: { "*": { permission: { write: { everyone: "allow" } } } },
		express: { "*": { permission: { write: { everyone: "allow" } } } },
	},
});
