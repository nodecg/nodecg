import type { ApplyLambdaToObjectValues } from "@nodecg/internal/utils";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import type { HKT, Schema } from "effect";

export type WidestFieldSchema =
	| Schema.Codec<any, any>
	| StandardSchemaV1<unknown, unknown>;

type SchemaKeys<
	In extends Readonly<Record<string, { readonly schema?: unknown }>>,
> = {
	[K in keyof In]: In[K] extends { readonly schema: {} } ? K : never;
}[keyof In] &
	string;

export type AddedSchemas<
	In extends Readonly<Record<string, { readonly schema?: WidestFieldSchema }>>,
> = {
	readonly [K in SchemaKeys<In>]: In[K] extends {
		readonly schema: infer S extends WidestFieldSchema;
	}
		? S
		: never;
};

export const mapSchemaValues =
	<
		FieldOption extends { readonly schema?: WidestFieldSchema },
		G extends HKT.TypeLambda,
	>() =>
	<In extends Record<string, FieldOption>>(
		obj: In | undefined,
		transform: (
			value: FieldOption & { readonly schema: WidestFieldSchema },
			key: string,
		) => HKT.Kind<G, unknown, never, never, WidestFieldSchema>,
	): ApplyLambdaToObjectValues<G, AddedSchemas<In>> => {
		const result: any = {};
		if (typeof obj !== "undefined") {
			for (const key of Object.keys(obj)) {
				const value = obj[key];
				if (typeof value === "undefined") {
					continue;
				}
				const schema = value.schema;
				if (typeof schema === "undefined") {
					continue;
				}
				result[key] = transform({ ...value, schema }, key);
			}
		}
		return result as ApplyLambdaToObjectValues<G, AddedSchemas<In>>;
	};

export type RpcSchemaPair = {
	readonly request: WidestFieldSchema;
	readonly response: WidestFieldSchema;
};

export type AddedRpcSchemas<
	In extends Readonly<Record<string, { readonly schema?: RpcSchemaPair }>>,
> = {
	readonly [K in SchemaKeys<In>]: In[K] extends {
		readonly schema: {
			readonly request: infer Req extends WidestFieldSchema;
			readonly response: infer Res extends WidestFieldSchema;
		};
	}
		? { readonly request: Req; readonly response: Res }
		: never;
};

export const mapRpcValues =
	<
		FieldOption extends { readonly schema?: RpcSchemaPair },
		G extends HKT.TypeLambda,
	>() =>
	<In extends Record<string, FieldOption>>(
		obj: In | undefined,
		transform: (
			value: FieldOption & { readonly schema: RpcSchemaPair },
			key: string,
		) => HKT.Kind<G, unknown, never, never, RpcSchemaPair>,
	): ApplyLambdaToObjectValues<G, AddedRpcSchemas<In>> => {
		const result: any = {};
		if (typeof obj !== "undefined") {
			for (const key of Object.keys(obj)) {
				const value = obj[key];
				if (typeof value === "undefined") {
					continue;
				}
				const schema = value.schema;
				if (typeof schema === "undefined") {
					continue;
				}
				result[key] = transform({ ...value, schema }, key);
			}
		}
		return result as ApplyLambdaToObjectValues<G, AddedRpcSchemas<In>>;
	};
