import { loadNamespace } from "@nodecg/server";

import { cross } from "../../src/server/namespaces.ts";
import { reportReady } from "../../src/server/report-ready.ts";

const loaded = await loadNamespace(cross, { onReady: reportReady });

loaded.start();
