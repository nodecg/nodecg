import type { NodeCG } from "../../types/nodecg";
import type { BundleManager } from "../bundle-manager";
export declare class SentryConfig {
    readonly bundleMetadata: {
        name: string;
        git: NodeCG.Bundle.GitData;
        version: string;
    }[];
    readonly app: import("express-serve-static-core").Express;
    constructor(bundleManager: BundleManager);
}
