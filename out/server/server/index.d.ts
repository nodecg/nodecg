import "../util/sentry-config";
import { TypedEmitter } from "../../shared/typed-emitter";
import type { NodeCG } from "../../types/nodecg";
import type { TypedSocketServer } from "../../types/socket-protocol";
interface EventMap {
    error: (error: unknown) => void;
    extensionsLoaded: () => void;
    started: () => void;
    stopped: () => void;
}
export declare class NodeCGServer extends TypedEmitter<EventMap> {
    readonly log: import("../../types/logger-interface").LoggerInterface;
    private readonly _io;
    private readonly _app;
    private readonly _server;
    private _replicator?;
    private _extensionManager?;
    /**
     * Only used by tests. Gross hack.
     */
    private _bundleManager;
    constructor();
    start(): Promise<void>;
    stop(): Promise<void>;
    getExtensions(): Record<string, unknown>;
    getSocketIOServer(): TypedSocketServer;
    mount: NodeCG.Middleware;
    saveAllReplicantsNow(): Promise<void>;
}
export {};
