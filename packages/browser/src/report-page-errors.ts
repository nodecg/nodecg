import type { LoadedRoot } from "@nodecg-next/client";

export const reportPageErrors = (
	root: LoadedRoot<
		{ replicant: {}; computed: {}; topic: {}; rpc: {}; children: {} },
		{}
	>,
) => {
	const onError = (event: ErrorEvent) => {
		root.reportError(event.error ?? event.message);
	};
	const onRejection = (event: PromiseRejectionEvent) => {
		root.reportError(event.reason);
	};
	window.addEventListener("error", onError);
	window.addEventListener("unhandledrejection", onRejection);
	return () => {
		window.removeEventListener("error", onError);
		window.removeEventListener("unhandledrejection", onRejection);
	};
};
