import type { NodeCG } from "../../types/nodecg";
export declare function parseMounts(manifest: Pick<NodeCG.Manifest, "mount" | "name">): NodeCG.Bundle.Mount[];
