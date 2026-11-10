import { implementNamespace, loadNamespace } from "@nodecg/server";

import { devProvider } from "../../src/server/fake-auth-provider.ts";
import { fixture, library } from "../../src/server/namespaces.ts";
import { reportReady } from "../../src/server/report-ready.ts";
import { replicantSyncManifest } from "./manifest.ts";

const replicantSync = implementNamespace(replicantSyncManifest, {
	children: { fixture, library },
});

const loaded = await loadNamespace(replicantSync, {
	authProviders: [devProvider],
	onReady: reportReady,
});

loaded.start();
