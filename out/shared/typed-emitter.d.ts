import { EventEmitter } from "events";
export interface Builtins {
    newListener(event: string, listener: EventReceiver<unknown>): void;
}
export type EventMap = Record<string, any>;
export type EventKey<T extends EventMap> = string & keyof T;
export type EventReceiver<T> = (params: T) => void;
export declare class TypedEmitter<T extends EventMap> {
    readonly _emitter: EventEmitter<[never]>;
    addListener<K extends EventKey<T & Builtins>>(eventName: K, fn: (T & Builtins)[K]): void;
    on<K extends EventKey<T & Builtins>>(eventName: K, fn: (T & Builtins)[K]): void;
    off<K extends EventKey<T & Builtins>>(eventName: K, fn: (T & Builtins)[K]): void;
    removeListener<K extends EventKey<T & Builtins>>(eventName: K, fn: (T & Builtins)[K]): void;
    emit<K extends EventKey<T & Builtins>>(eventName: K, ...params: Parameters<(T & Builtins)[K]>): void;
    once<K extends EventKey<T & Builtins>>(eventName: K, fn: (T & Builtins)[K]): void;
    setMaxListeners(max: number): void;
    listenerCount(eventName: string): number;
    listeners<K extends EventKey<T & Builtins>>(eventName: K): (T & Builtins)[K][];
}
