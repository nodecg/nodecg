/**
 * A standard debounce, but uses a string `name` as the key instead of the callback.
 */
export declare function debounceName(name: string, callback: () => void, duration?: number): void;
