export function isBrowser(): boolean {
	return typeof globalThis.window !== 'undefined';
}
