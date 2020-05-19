const timers = new Map<string, NodeJS.Timer>();
const queued = new Set<string>();

/**
 * A standard throttle, but uses a string `name` as the key instead of the callback.
 */
export default function(name: string, callback: () => void, duration = 500): void {
	const existing = timers.get(name);
	if (existing) {
		queued.add(name);
		return;
	}

	callback();
	timers.set(
		name,
		setTimeout(() => {
			timers.delete(name);
			if (queued.has(name)) {
				queued.delete(name);
				callback();
			}
		}, duration),
	);
}
