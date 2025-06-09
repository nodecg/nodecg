"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.throttleName = throttleName;
const timers = new Map();
const queued = new Set();
/**
 * A standard throttle, but uses a string `name` as the key instead of the callback.
 */
function throttleName(name, callback, duration = 500) {
    const existing = timers.get(name);
    if (existing) {
        queued.add(name);
        return;
    }
    callback();
    timers.set(name, setTimeout(() => {
        timers.delete(name);
        if (queued.has(name)) {
            queued.delete(name);
            callback();
        }
    }, duration));
}
//# sourceMappingURL=throttle-name.js.map