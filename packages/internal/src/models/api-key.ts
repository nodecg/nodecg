import { Schema } from "effect";

export const ApiKeyId = Schema.String.pipe(Schema.brand("ApiKeyId"));
export type ApiKeyId = typeof ApiKeyId.Type;
