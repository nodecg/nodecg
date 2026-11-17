import { Schema } from "effect";

import { FileSafeName } from "./file-safe-name.ts";

export const NamespacePath = Schema.NonEmptyArray(FileSafeName);
export type NamespacePath = typeof NamespacePath.Type;

export const formatNamespacePath = (namespace: NamespacePath) =>
	namespace.join("/");

export const formatField = (namespace: NamespacePath, name: string) =>
	`"${name}" in "${formatNamespacePath(namespace)}"`;
