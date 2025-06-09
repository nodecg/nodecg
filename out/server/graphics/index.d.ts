import type { RootNS } from "../../types/socket-protocol";
import type { BundleManager } from "../bundle-manager";
import type { Replicator } from "../replicant/replicator";
export declare class GraphicsLib {
    app: import("express-serve-static-core").Express;
    constructor(io: RootNS, bundleManager: BundleManager, replicator: Replicator);
}
