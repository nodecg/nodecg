const timers = new Map<string, NodeJS.Timer>();

/**
 * A standard debounce, but uses a string `name` as the key instead of the callback.
 */
export function debounceName(
	name: string,
	callback: () => void,
	duration = 500,
): void {
	const existing = timers.get(name);
	if (existing) {
		clearTimeout(existing);
	}

	timers.set(
		name,
		setTimeout(() => {
			timers.delete(name);
			callback();
		}, duration),
	);
}
