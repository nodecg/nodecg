import { loadNamespace } from "@nodecg-next/server";

import { devProvider } from "../../src/server/fake-auth-provider.ts";
import { fixture } from "../../src/server/namespaces.ts";
import { reportReady } from "../../src/server/report-ready.ts";

const loaded = await loadNamespace(fixture, {
	authProviders: [devProvider],
	onReady: reportReady,
});

loaded.start();
