"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TypedEmitter = void 0;
const events_1 = require("events");
class TypedEmitter {
    _emitter = new events_1.EventEmitter();
    addListener(eventName, fn) {
        this._emitter.addListener(eventName, fn);
    }
    on(eventName, fn) {
        this._emitter.on(eventName, fn);
    }
    off(eventName, fn) {
        this._emitter.off(eventName, fn);
    }
    removeListener(eventName, fn) {
        this._emitter.removeListener(eventName, fn);
    }
    emit(eventName, ...params) {
        this._emitter.emit(eventName, ...params);
    }
    once(eventName, fn) {
        this._emitter.once(eventName, fn);
    }
    setMaxListeners(max) {
        this._emitter.setMaxListeners(max);
    }
    listenerCount(eventName) {
        return this._emitter.listenerCount(eventName);
    }
    listeners(eventName) {
        return this._emitter.listeners(eventName);
    }
}
exports.TypedEmitter = TypedEmitter;
//# sourceMappingURL=typed-emitter.js.map