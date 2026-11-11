import { Schema } from "effect";

export const NamespacePath = Schema.NonEmptyArray(Schema.String);
export type NamespacePath = typeof NamespacePath.Type;

export const formatNamespacePath = (namespace: NamespacePath) =>
	namespace.join("/");

export const formatField = (namespace: NamespacePath, name: string) =>
	`"${name}" in "${formatNamespacePath(namespace)}"`;
