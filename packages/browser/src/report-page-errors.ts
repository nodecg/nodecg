import type { LoadedNodeCG } from "@nodecg-next/client";

export const reportPageErrors = (
	nodecg: LoadedNodeCG<Record<never, never>>,
) => {
	const onError = (event: ErrorEvent) => {
		nodecg.reportError(event.error ?? event.message);
	};
	const onRejection = (event: PromiseRejectionEvent) => {
		nodecg.reportError(event.reason);
	};
	window.addEventListener("error", onError);
	window.addEventListener("unhandledrejection", onRejection);
	return () => {
		window.removeEventListener("error", onError);
		window.removeEventListener("unhandledrejection", onRejection);
	};
};
