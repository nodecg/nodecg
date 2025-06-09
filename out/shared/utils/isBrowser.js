"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isBrowser = isBrowser;
exports.isWorker = isWorker;
function isBrowser() {
    return typeof globalThis.window !== "undefined";
}
function isWorker() {
    return (typeof globalThis.WorkerGlobalScope !== "undefined" &&
        self instanceof globalThis.WorkerGlobalScope);
}
//# sourceMappingURL=isBrowser.js.map