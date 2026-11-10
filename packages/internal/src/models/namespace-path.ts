import { Schema } from "effect";

export const NamespacePath = Schema.NonEmptyArray(Schema.String);
export type NamespacePath = typeof NamespacePath.Type;
