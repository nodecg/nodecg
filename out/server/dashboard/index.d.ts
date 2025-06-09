import type { NodeCG } from "../../types/nodecg";
import type { BundleManager } from "../bundle-manager";
import { config, filteredConfig } from "../config";
type Workspace = NodeCG.Workspace;
interface DashboardContext {
    bundles: NodeCG.Bundle[];
    publicConfig: typeof filteredConfig;
    privateConfig: typeof config;
    workspaces: Workspace[];
    sentryEnabled: boolean;
}
export declare class DashboardLib {
    app: import("express-serve-static-core").Express;
    dashboardContext: DashboardContext | undefined;
    constructor(bundleManager: BundleManager);
}
export {};
