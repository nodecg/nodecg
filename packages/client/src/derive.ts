import { computed, effect } from "@preact/signals-core";
import { Equal } from "effect";

import {
	type DerivedLoadable,
	Loadable,
	ReadyLoadableValue,
	Pending,
} from "./loadable.ts";

/**
 * React Suspense-like thrown value to resolve asynchronous values read in derive functions
 */
const SUSPENDED: unique symbol = Symbol("client/suspended");

const isSuspended = (e: unknown): e is typeof SUSPENDED => e === SUSPENDED;

export const fieldSource: unique symbol = Symbol("client/field-source");

export interface FieldSource<T> {
	readonly [fieldSource]: { readonly value: Loadable<ReadyLoadableValue<T>> };
}

export interface DerivedHandle<T> extends FieldSource<T> {
	readonly get: () => Promise<T>;
	readonly subscribe: (
		listener: (value: T, oldValue: T | undefined) => void,
		onError?: (error: unknown) => void,
	) => () => void;
}

const getAccessor = <T>(source: FieldSource<T>): T => {
	const loadable = source[fieldSource].value;
	switch (loadable._tag) {
		case "Ready":
			return loadable.value.decoded;
		case "Failure":
			throw loadable.error;
		case "Pending":
		case "Cold":
			throw SUSPENDED;
	}
};

export type Get = typeof getAccessor;

/**
 * Client-local reactive value calculated from other fields
 */
export const derive = <T>(
	compute: (get: Get) => T,
	options?: { readonly equals?: (a: T, b: T) => boolean },
): DerivedHandle<T> => {
	const equals = options?.equals;
	const isReady = Loadable.$is("Ready");
	const same = (a: DerivedLoadable<T>, b: DerivedLoadable<T>): boolean =>
		equals && isReady(a) && isReady(b)
			? equals(a.value.decoded, b.value.decoded)
			: Equal.equals(a, b);

	let last: DerivedLoadable<T> | undefined;
	const derived = computed<DerivedLoadable<T>>(() => {
		let next: DerivedLoadable<T>;
		try {
			const decoded = compute(getAccessor);
			next = Loadable.Ready({
				value: ReadyLoadableValue.Derived({ decoded }),
			});
		} catch (error) {
			// Catch SUSPENDED value and propagate as Pending, which makes it wait for next update
			next = isSuspended(error) ? Pending : Loadable.Failure({ error });
		}
		if (typeof last !== "undefined" && same(last, next)) {
			return last;
		}
		last = next;
		return next;
	});

	const get = () =>
		new Promise<T>((resolve, reject) => {
			const settle = (state: DerivedLoadable<T>): boolean =>
				Loadable.$match(state, {
					Ready: ({ value }) => {
						resolve(value.decoded);
						return true;
					},
					Failure: ({ error }) => {
						reject(error);
						return true;
					},
					Cold: () => false,
					Pending: () => false,
				});
			if (settle(derived.peek())) {
				return;
			}
			// Setup reactive effect only when value isn't ready
			const dispose = effect(() => {
				if (settle(derived.value)) {
					dispose();
				}
			});
		});

	const subscribe = (
		listener: (value: T, oldValue: T | undefined) => void,
		onError?: (error: unknown) => void,
	) => {
		let lastValue: T | undefined;
		return effect(() => {
			Loadable.$match(derived.value, {
				Ready: ({ value }) => {
					const oldValue = lastValue;
					lastValue = value.decoded;
					listener(value.decoded, oldValue);
				},
				Failure: ({ error }) => onError?.(error),
				Cold: () => {},
				Pending: () => {},
			});
		});
	};

	return { get, subscribe, [fieldSource]: derived };
};
