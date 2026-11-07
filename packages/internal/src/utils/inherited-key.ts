import { Option, type Schema } from "effect";

// Plain objects answer these names from their prototype, so a document key that matches one cannot be told from the inherited member
export const isInheritedKey = (key: string) => key in Object.prototype;

export const findInheritedKey = (value: Schema.Json): Option.Option<string> => {
	if (value === null || typeof value !== "object") {
		return Option.none();
	}
	for (const [key, child] of Object.entries(value)) {
		if (isInheritedKey(key)) {
			return Option.some(key);
		}
		const nested = findInheritedKey(child);
		if (Option.isSome(nested)) {
			return nested;
		}
	}
	return Option.none();
};
