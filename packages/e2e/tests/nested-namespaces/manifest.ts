import { defineNamespace } from "@nodecg-next/core";
import { Schema } from "effect";

export const nestAssetsManifest = defineNamespace("e2e-nest-assets", {
	roles: {
		uploader: { permission: ["replicant-write"] },
	},
	replicant: {
		files: {
			schema: Schema.Finite,
			permission: { read: { everyone: "allow" } },
		},
		uploads: {
			schema: Schema.Finite,
			permission: { read: { everyone: "allow" } },
		},
	},
});

export const nestManifest = defineNamespace("e2e-nest", {
	roles: {
		operator: {
			permission: [],
			linkedRoles: [nestAssetsManifest.roles.uploader],
		},
		viewer: { permission: [] },
	},
	children: { assets: nestAssetsManifest },
});
