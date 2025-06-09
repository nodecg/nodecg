"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.debounceName = debounceName;
const timers = new Map();
/**
 * A standard debounce, but uses a string `name` as the key instead of the callback.
 */
function debounceName(name, callback, duration = 500) {
    const existing = timers.get(name);
    if (existing) {
        clearTimeout(existing);
    }
    timers.set(name, setTimeout(() => {
        timers.delete(name);
        callback();
    }, duration));
}
//# sourceMappingURL=debounce-name.js.map