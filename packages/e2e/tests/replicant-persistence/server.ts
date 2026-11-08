import { implementNamespace, loadNamespace } from "@nodecg/server";

import { reportReady } from "../../src/server/report-ready.ts";
import { persistenceManifest } from "./manifest.ts";

const persistence = implementNamespace(persistenceManifest, {
	seedReplicant: { live: () => 0, score: () => 0 },
});

const loaded = await loadNamespace(persistence, { onReady: reportReady });

loaded.start();
