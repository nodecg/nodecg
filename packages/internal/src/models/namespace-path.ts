import { Schema, SchemaGetter, SchemaTransformation } from "effect";

import { FileSafeName } from "./file-safe-name.ts";

export const NamespacePath = Schema.NonEmptyArray(FileSafeName);
export type NamespacePath = typeof NamespacePath.Type;

export const NamespacePathFromString = Schema.String.pipe(
	Schema.decodeTo(Schema.Array(Schema.String), {
		decode: SchemaGetter.split({ separator: "." }),
		encode: SchemaGetter.transform((segments) => segments.join(".")),
	}),
	Schema.decodeTo(NamespacePath, SchemaTransformation.passthroughSupertype()),
);

export const formatNamespacePath = (namespace: NamespacePath) =>
	namespace.join("/");

export const formatField = (namespace: NamespacePath, name: string) =>
	`"${name}" in "${formatNamespacePath(namespace)}"`;
