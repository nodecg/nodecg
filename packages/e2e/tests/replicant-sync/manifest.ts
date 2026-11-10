import { defineNamespace } from "@nodecg/core";

import {
	fixtureManifest,
	libraryManifest,
} from "../../src/shared/manifests.ts";

export const replicantSyncManifest = defineNamespace("e2e-replicant-sync", {
	children: { fixture: fixtureManifest, library: libraryManifest },
});
