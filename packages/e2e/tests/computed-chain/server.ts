import { implementNamespace, loadNamespace } from "@nodecg/server";

import { chain, cross } from "../../src/server/namespaces.ts";
import { reportReady } from "../../src/server/report-ready.ts";
import { computedChainManifest } from "./manifest.ts";

const computedChain = implementNamespace(computedChainManifest, {
	children: { chain, cross },
});

const loaded = await loadNamespace(computedChain, { onReady: reportReady });

loaded.start();
