import { Effect, HashSet, type HKT } from "effect";

import type { WidestFieldSchema } from "./field-schema.ts";

const unsafeObjectKeys = <T extends object>(obj: T) =>
	Object.keys(obj) as (keyof T & string)[];

export type ApplyLambdaToObjectValues<
	F extends HKT.TypeLambda,
	Target extends Record<string, unknown>,
	Out1 = never,
	Out2 = never,
	In = unknown,
> = {
	readonly [K in keyof Target & string]: HKT.Kind<F, In, Out2, Out1, Target[K]>;
};

export const mapValues =
	<F extends HKT.TypeLambda, G extends HKT.TypeLambda>(
		transform: <Target, In = unknown>(
			value: HKT.Kind<F, In, never, never, Target>,
			key: string,
		) => HKT.Kind<G, In, never, never, Target>,
	) =>
	<Target extends Record<string, unknown>, In = unknown>(
		obj: ApplyLambdaToObjectValues<F, Target, never, never, In> | undefined,
	): ApplyLambdaToObjectValues<G, Target, never, never, In> => {
		const result: Partial<
			ApplyLambdaToObjectValues<G, Target, never, never, In>
		> = {};
		// TODO: handle undefined before this function is called
		if (typeof obj !== "undefined") {
			for (const key of unsafeObjectKeys(obj)) {
				result[key] = transform(obj[key], key);
			}
		}
		return result as ApplyLambdaToObjectValues<G, Target, never, never, In>;
	};

export const mapEffectValues =
	<F extends HKT.TypeLambda, G extends HKT.TypeLambda>() =>
	<E, R>(
		transform: <Target, In = unknown>(
			value: HKT.Kind<F, In, never, never, Target>,
			key: string,
		) => Effect.Effect<HKT.Kind<G, In, never, never, Target>, E, R>,
	) =>
	<Target extends Record<string, unknown>, In = unknown>(
		obj: ApplyLambdaToObjectValues<F, Target, never, never, In> | undefined,
	): Effect.Effect<
		ApplyLambdaToObjectValues<G, Target, never, never, In>,
		E,
		R
	> =>
		Effect.gen(function* () {
			const result: Partial<
				ApplyLambdaToObjectValues<G, Target, never, never, In>
			> = {};
			if (typeof obj !== "undefined") {
				for (const key of unsafeObjectKeys(obj)) {
					result[key] = yield* transform(obj[key], key);
				}
			}
			return result as ApplyLambdaToObjectValues<G, Target, never, never, In>;
		});

export const zipEffectValues =
	<
		F extends HKT.TypeLambda,
		C extends HKT.TypeLambda,
		G extends HKT.TypeLambda,
		In,
		Target extends Record<string, unknown>,
	>() =>
	<E, R>(
		obj: ApplyLambdaToObjectValues<F, Target>,
		ctx: ApplyLambdaToObjectValues<C, Target, never, never, In> | undefined,
		transform: <K extends keyof Target & string>(
			value: HKT.Kind<F, unknown, never, never, Target[K]>,
			context: HKT.Kind<C, In, never, never, Target[K]>,
			key: keyof Target & string,
		) => Effect.Effect<HKT.Kind<G, In, never, never, Target[K]>, E, R>,
	) =>
		Effect.gen(function* () {
			const result: Partial<
				ApplyLambdaToObjectValues<G, Target, never, never, In>
			> = {};
			if (typeof ctx === "undefined") {
				return result as ApplyLambdaToObjectValues<G, Target, never, never, In>;
			}
			for (const key of Object.keys(obj) as (keyof Target & string)[]) {
				result[key] = yield* transform(obj[key], ctx[key], key);
			}
			return result as ApplyLambdaToObjectValues<G, Target, never, never, In>;
		});

type SchemaKeys<In> = {
	[K in keyof In]: In[K] extends { readonly schema: {} } ? K : never;
}[keyof In] &
	string;

export type AddedSchemas<In> = {
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

type RpcSchemaSlot = {
	readonly request: WidestFieldSchema;
	readonly response: WidestFieldSchema;
};

export type AddedRpcSchemas<In> = {
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
		FieldOption extends { readonly schema?: RpcSchemaSlot },
		G extends HKT.TypeLambda,
	>() =>
	<In extends Record<string, FieldOption>>(
		obj: In | undefined,
		transform: (
			value: FieldOption & { readonly schema: RpcSchemaSlot },
			key: string,
		) => HKT.Kind<G, unknown, never, never, RpcSchemaSlot>,
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

export type NestedValues<In, Output> = {
	readonly [K in keyof In & string]: {
		readonly [L in keyof In[K]]: Output;
	};
};

export const mapNestedValues =
	<Value>() =>
	<
		In extends Readonly<
			Record<string, Readonly<Record<string, Value | undefined>>>
		>,
		Output,
	>(
		obj: In | undefined,
		transform: (value: Value | undefined, outerKey: string) => Output,
	) =>
		Object.fromEntries(
			Object.entries(obj ?? {}).map(([outerKey, inner]) => {
				const innerEntries = Object.entries(inner).map(
					([innerKey, value]) =>
						[innerKey, transform(value, outerKey)] as const,
				);
				return [outerKey, Object.fromEntries(innerEntries)] as const;
			}),
		) as NestedValues<In, Output>;

export type MergedNestedKeys<Base, Extra> = {
	readonly [K in (keyof Base | keyof Extra) & string]: {
		readonly [L in
			| (K extends keyof Base ? keyof Base[K] : never)
			| (K extends keyof Extra ? keyof Extra[K] : never)]: never;
	};
};

const unionKeys = (left: object, right: object) =>
	HashSet.union(
		HashSet.fromIterable(Object.keys(left)),
		HashSet.fromIterable(Object.keys(right)),
	);

export const mergeNestedValues =
	<ExtraValue>() =>
	<
		BaseValue,
		Base extends Readonly<Record<string, Readonly<Record<string, unknown>>>>,
		Extra extends Readonly<
			Record<string, Readonly<Record<string, ExtraValue | undefined>>>
		>,
		Output,
	>(
		base: NestedValues<Base, BaseValue>,
		extra: Extra | undefined,
		transform: (
			baseValue: BaseValue | undefined,
			extraValue: ExtraValue | undefined,
			outerKey: string,
		) => Output,
	) =>
		Object.fromEntries(
			Array.from(unionKeys(base, extra ?? {}), (outerKey) => {
				const baseRecord: Readonly<
					Record<string, Readonly<Record<string, BaseValue | undefined>>>
				> = base;
				const baseInner = baseRecord[outerKey] ?? {};
				const extraInner: Readonly<Record<string, ExtraValue | undefined>> =
					extra?.[outerKey] ?? {};
				const inner = Array.from(
					unionKeys(baseInner, extraInner),
					(innerKey) =>
						[
							innerKey,
							transform(baseInner[innerKey], extraInner[innerKey], outerKey),
						] as const,
				);
				return [outerKey, Object.fromEntries(inner)] as const;
			}),
		) as NestedValues<MergedNestedKeys<Base, Extra>, Output>;

// TODO: nowhere near type safe. Result can do anything.
export function mergeRecords<Result>(
	base: Readonly<Record<string, unknown>> | undefined,
	extra: Readonly<Record<string, unknown>> | undefined,
): Result {
	return { ...base, ...extra } as Result;
}
