import type { ReactNode } from "react";
import ReactDOM from "react-dom/client";

export const render = (node: ReactNode) => {
	const rootElement = document.getElementById("app");
	if (rootElement === null) {
		throw new Error("#app not found");
	}
	ReactDOM.createRoot(rootElement).render(node);
};
