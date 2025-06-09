import type { RootNS } from "../../types/socket-protocol";
import type { BundleManager } from "../bundle-manager";
import type { Replicator } from "../replicant/replicator";
export declare class RegistrationCoordinator {
    app: import("express-serve-static-core").Express;
    private readonly _instancesRep;
    private readonly _bundleManager;
    constructor(io: RootNS, bundleManager: BundleManager, replicator: Replicator);
    private _addRegistration;
    private _removeRegistration;
    private _findRegistrationBySocketId;
    private _findOpenRegistrationByPathName;
    private _updateInstanceStatuses;
    private _findGraphicManifest;
}
