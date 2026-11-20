import { Effect, Schema } from "effect";

import {
	type NamespacePath,
	NamespacePathFromString,
} from "./models/namespace-path.ts";

const encodeNamespacePath = Schema.encodeEffect(NamespacePathFromString);

export const customRoutePath = Effect.fnUntraced(function* (
	namespace: NamespacePath,
	name: string,
) {
	const segment = yield* encodeNamespacePath(namespace).pipe(
		Effect.catchTag("SchemaError", Effect.die),
	);
	return `/namespaces/${segment}/custom/${encodeURIComponent(name)}` as const;
});
