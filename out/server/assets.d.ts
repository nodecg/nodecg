import type { NodeCG } from "../types/nodecg";
import type { Replicator } from "./replicant/replicator";
export declare const createAssetsMiddleware: (bundles: NodeCG.Bundle[], replicator: Replicator) => import("express-serve-static-core").Router;
