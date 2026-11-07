import { defineNamespace } from "@nodecg-next/core";

import { chainManifest, crossManifest } from "../../src/shared/manifests.ts";

export const computedChainManifest = defineNamespace("e2e-computed-chain", {
	children: { chain: chainManifest, cross: crossManifest },
});
