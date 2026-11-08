import type { JSONSchemaDraft2020_12 } from "@hey-api/spec-types";
import { JsonSchema, Schema, SchemaRepresentation } from "effect";
import type { Static } from "typebox";

const decodeRecord = Schema.decodeUnknownSync(
	Schema.Record(Schema.String, Schema.Unknown),
);

type UnsupportedKeyword =
	| "not"
	| "if"
	| "contains"
	| "dependentRequired"
	| "dependentSchemas"
	| "unevaluatedItems"
	| "unevaluatedProperties"
	| "$dynamicRef";

type SubschemaKeyword =
	| "items"
	| "additionalProperties"
	| "propertyNames"
	| "then"
	| "else"
	| "contentSchema";

type SubschemaCollectionKeyword =
	| "allOf"
	| "anyOf"
	| "oneOf"
	| "prefixItems"
	| "properties"
	| "patternProperties"
	| "$defs";

type ImportableDocument<T> = {
	[K in keyof T]: K extends UnsupportedKeyword
		? `Unsupported JSON Schema keyword "${K}"`
		: K extends SubschemaKeyword
			? ImportableDocument<T[K]>
			: K extends SubschemaCollectionKeyword
				? { [P in keyof T[K]]: ImportableDocument<T[K][P]> }
				: T[K];
};

// Static<{}> is unknown, and Static<{ "type": "object"}> is generic object
type AsJson<V> = unknown extends V
	? Schema.Json
	: V extends Schema.Json
		? V
		: V & Schema.Json;

export interface JsonSchemaCodec<
	TValue extends Schema.Json,
> extends Schema.Codec<TValue, TValue> {}

export const jsonSchema = <
	TValue extends AsJson<Static<T>>,
	const T extends JSONSchemaDraft2020_12.Document,
>(
	schema: T & ImportableDocument<T>,
) =>
	SchemaRepresentation.fromJsonSchemaDocument(
		JsonSchema.fromSchemaDraft2020_12(decodeRecord(schema)),
		{ patterns: "apply" },
	) as JsonSchemaCodec<TValue>;
