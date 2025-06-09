import { TypedEmitter } from "../shared/typed-emitter";
import type { NodeCG } from "../types/nodecg";
interface EventMap {
    bundleRemoved: (bundleName: string) => void;
    gitChanged: (bundle: NodeCG.Bundle) => void;
    bundleChanged: (reparsedBundle: NodeCG.Bundle) => void;
    invalidBundle: (bundle: NodeCG.Bundle, error: Error) => void;
    ready: () => void;
}
export declare class BundleManager extends TypedEmitter<EventMap> {
    bundles: NodeCG.Bundle[];
    get ready(): boolean;
    private _ready;
    private readonly _cfgPath;
    private readonly _debouncedGitChangeHandler;
    constructor(bundlesPaths: string[], cfgPath: string, nodecgVersion: string, nodecgConfig: Record<string, any>);
    /**
     * Returns a shallow-cloned array of all currently active bundles.
     * @returns {Array.<Object>}
     */
    all(): NodeCG.Bundle[];
    /**
     * Returns the bundle with the given name. undefined if not found.
     * @param name {String} - The name of the bundle to find.
     * @returns {Object|undefined}
     */
    find(name: string): NodeCG.Bundle | undefined;
    /**
     * Adds a bundle to the internal list, replacing any existing bundle with the same name.
     * @param bundle {Object}
     */
    add(bundle: NodeCG.Bundle): void;
    /**
     * Removes a bundle with the given name from the internal list. Does nothing if no match found.
     * @param bundleName {String}
     */
    remove(bundleName: string): void;
    handleChange(bundleName: string): void;
    /**
     * Resets the backoff timer used to avoid event thrashing when many files change rapidly.
     */
    resetBackoffTimer(): void;
    /**
     * Checks if a given path is a panel HTML file of a given bundle.
     * @param bundleName {String}
     * @param filePath {String}
     * @returns {Boolean}
     * @private
     */
    isPanelHTMLFile(bundleName: string, filePath: string): boolean;
    /**
     * Only used by tests.
     */
    _stopWatching(): void;
    private _handleChange;
}
export {};
