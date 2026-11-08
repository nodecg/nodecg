import type { Schema } from "effect";
import { klona } from "klona/json";

export function cloneJson(value: Schema.Json): Schema.MutableJson {
	return klona(value) as Schema.MutableJson;
}
