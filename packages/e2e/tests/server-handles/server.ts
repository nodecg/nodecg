import { loadNamespace } from "@nodecg/server";

import { fixture } from "../../src/server/namespaces.ts";
import { reportReady } from "../../src/server/report-ready.ts";

const loaded = await loadNamespace(fixture, { onReady: reportReady });

const { mirrorSource, mirror } = loaded.replicant;
mirrorSource.subscribe(async (value) => {
	await mirror.set(value);
});

loaded.start();
