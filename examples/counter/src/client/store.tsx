import { loadNamespace, type TopicField } from "@nodecg/client";
import { type ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

import { rootManifest } from "../shared/manifest.ts";

export const root = await loadNamespace(rootManifest);
export const { counter } = root.children;

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
