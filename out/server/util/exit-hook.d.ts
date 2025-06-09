type syncExitFn = (signal: number) => void;
type asyncExitFn = (signal: number) => void | Promise<void>;
export declare function exitHook(onExit: syncExitFn): () => void;
export declare function asyncExitHook(onExit: asyncExitFn, options?: {
    minimumWait?: number;
}): () => void;
export declare function gracefulExit(signal?: number): void;
export {};
