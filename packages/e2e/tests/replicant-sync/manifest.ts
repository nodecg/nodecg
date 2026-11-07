import { defineNamespace } from "@nodecg-next/core";

import {
	extendedManifest,
	fixtureManifest,
} from "../../src/shared/manifests.ts";

export const replicantSyncManifest = defineNamespace("e2e-replicant-sync", {
	children: { fixture: fixtureManifest, extended: extendedManifest },
});
