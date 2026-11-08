import { implementNamespace, loadNamespace } from "@nodecg/server";

import { devProvider } from "../../src/server/fake-auth-provider.ts";
import { reportReady } from "../../src/server/report-ready.ts";
import { nestAssetsManifest, nestManifest } from "./manifest.ts";

const nest = implementNamespace(nestManifest, {
	children: {
		assets: implementNamespace(nestAssetsManifest, {
			seedReplicant: { files: () => 4, uploads: () => 0 },
		}),
	},
});

const loaded = await loadNamespace(nest, {
	authProviders: [devProvider],
	onReady: reportReady,
});

loaded.start();
