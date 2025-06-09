/**
 * A standard throttle, but uses a string `name` as the key instead of the callback.
 */
export declare function throttleName(name: string, callback: () => void, duration?: number): void;
