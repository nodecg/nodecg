import {
	loadNamespace,
	type ComputedField,
	type DerivedHandle,
	type ReplicantField,
	type TopicField,
} from "@nodecg/client";
import {
	type ReactNode,
	useEffect,
	useState,
	useSyncExternalStore,
} from "react";
import ReactDOM from "react-dom/client";

import { rootManifest } from "../shared/manifest.ts";

export const root = await loadNamespace(rootManifest);
export const { counter } = root.children;

type Handle<T> = ReplicantField<T> | ComputedField<T> | DerivedHandle<T>;

type Snapshot<T> = { readonly value: T };

interface SyncStore<T> {
	readonly subscribe: (onStoreChange: () => void) => () => void;
	readonly getSnapshot: () => Snapshot<T> | undefined;
	readonly ready: Promise<void>;
}

const toSyncStore = <T,>(handle: Handle<T>): SyncStore<T> => {
	let snapshot: Snapshot<T> | undefined;
	const listeners = new Set<() => void>();
	const ready = new Promise<void>((resolve) => {
		handle.subscribe(
			(value) => {
				snapshot = { value };
				for (const listener of listeners) {
					listener();
				}
				resolve();
			},
			(error) => {
				console.error(error);
			},
		);
	});
	return {
		ready,
		subscribe: (onStoreChange) => {
			listeners.add(onStoreChange);
			return () => {
				listeners.delete(onStoreChange);
			};
		},
		getSnapshot: () => snapshot,
	};
};

const stores = new WeakMap<object, SyncStore<unknown>>();

const getStore = <T,>(handle: Handle<T>) => {
	const existing = stores.get(handle);
	if (typeof existing !== "undefined") {
		return existing as SyncStore<T>;
	}
	const store = toSyncStore(handle);
	stores.set(handle, store);
	return store;
};

export function useField<T>(handle: Handle<T>): T {
	const [store] = useState(() => getStore(handle));
	const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot);
	if (typeof snapshot === "undefined") {
		throw store.ready;
	}
	return snapshot.value;
}

export function useTopic<T>(field: TopicField<T>): readonly T[] {
	const [messages, setMessages] = useState<readonly T[]>([]);
	useEffect(
		() => field.subscribe((value) => setMessages((prev) => [...prev, value])),
		[field],
	);
	return messages;
}

export const mount = (node: ReactNode) => {
	const rootElement = document.getElementById("app");
	if (rootElement === null) {
		throw new Error("#app not found");
	}
	ReactDOM.createRoot(rootElement).render(node);
};
