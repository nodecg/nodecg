/* eslint-disable @typescript-eslint/generic-type-naming */
// Native
import { EventEmitter } from 'events';

type Builtins = {
	newListener(event: string, listener: EventReceiver<unknown>): void;
};

type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

export class TypedEmitter<T extends EventMap> {
	private readonly _emitter = new EventEmitter();
	on<K extends EventKey<T & Builtins>>(eventName: K, fn: (T & Builtins)[K]): void {
		this._emitter.on(eventName, fn);
	}

	off<K extends EventKey<T & Builtins>>(eventName: K, fn: (T & Builtins)[K]): void {
		this._emitter.off(eventName, fn);
	}

	emit<K extends EventKey<T & Builtins>>(eventName: K, ...params: Parameters<(T & Builtins)[K]>): void {
		this._emitter.emit(eventName, ...params);
	}

	once<K extends EventKey<T & Builtins>>(eventName: K, fn: (T & Builtins)[K]): void {
		this._emitter.once(eventName, fn);
	}

	setMaxListeners(max: number): void {
		this._emitter.setMaxListeners(max);
	}

	listenerCount(eventName: string): number {
		return this._emitter.listenerCount(eventName);
	}

	listeners<K extends EventKey<T & Builtins>>(eventName: K): Array<(T & Builtins)[K]> {
		return this._emitter.listeners(eventName) as any;
	}
}
