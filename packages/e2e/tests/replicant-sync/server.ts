import { implementNamespace, loadNamespace } from "@nodecg-next/server";

import { devProvider } from "../../src/server/fake-auth-provider.ts";
import { extended, fixture } from "../../src/server/namespaces.ts";
import { reportReady } from "../../src/server/report-ready.ts";
import { replicantSyncManifest } from "./manifest.ts";

const replicantSync = implementNamespace(replicantSyncManifest, {
	children: { fixture, extended },
});

const loaded = await loadNamespace(replicantSync, {
	authProviders: [devProvider],
	onReady: reportReady,
});

loaded.start();
