import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { Schema } from "effect";

export type WidestFieldSchema =
	| Schema.Codec<any, any>
	| StandardSchemaV1<unknown, unknown>;
