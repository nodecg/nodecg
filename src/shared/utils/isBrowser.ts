export function isBrowser(): boolean {
	return typeof globalThis.window !== "undefined";
}

export function isWorker(): boolean {
	return (
		typeof (globalThis as any).WorkerGlobalScope !== "undefined" &&
		self instanceof (globalThis as any).WorkerGlobalScope
	);
}
