import { EventEmitter } from "node:events";
import type { NodeCG } from "../../types/nodecg";
import type { RootNS } from "../../types/socket-protocol";
import type { BundleManager } from "../bundle-manager";
import type { Replicator } from "../replicant/replicator";
export interface ExtensionEventMap {
    login: (user: Express.Request["user"]) => void;
    logout: (user: Express.Request["user"]) => void;
    extensionsLoaded: () => void;
    serverStarted: () => void;
    serverStopping: () => void;
}
export declare class ExtensionManager extends EventEmitter {
    readonly extensions: Record<string, unknown>;
    private readonly _satisfiedDepNames;
    private readonly _ExtensionApi;
    private readonly _bundleManager;
    private readonly _apiInstances;
    constructor(io: RootNS, bundleManager: BundleManager, replicator: Replicator, mount: NodeCG.Middleware);
    emitToAllInstances<K extends keyof ExtensionEventMap>(eventName: K, ...params: Parameters<ExtensionEventMap[K]>): void;
    private _loadExtension;
    private _bundleDepsSatisfied;
}
