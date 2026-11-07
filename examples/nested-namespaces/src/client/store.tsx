import type { ComputedField, ReplicantField } from "@nodecg-next/client";
import { type ReactNode, useEffect, useState } from "react";
import ReactDOM from "react-dom/client";

export function useReplicant<T>(field: ReplicantField<T> | ComputedField<T>) {
	const [value, setValue] = useState<T>();
	useEffect(() => {
		const subscription = field.subscribe((next) => {
			setValue(() => next);
		});
		return () => {
			void subscription.then((cancel) => cancel());
		};
	}, [field]);
	return value;
}

export const render = (node: ReactNode) => {
	const rootElement = document.getElementById("app");
	if (rootElement === null) {
		throw new Error("#app not found");
	}
	ReactDOM.createRoot(rootElement).render(node);
};
