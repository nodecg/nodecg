import { it } from "@effect/vitest";
import { Context, Effect, Schema, type HKT } from "effect";
import { describe, expect, expectTypeOf, test } from "vitest";

import {
	mapEffectValues,
	mapNestedValues,
	mapValues,
	zipEffectValues,
} from "./map-values.ts";

interface IdentityLambda extends HKT.TypeLambda {
	readonly type: this["Target"];
}

interface ArrayLambda extends HKT.TypeLambda {
	readonly type: ReadonlyArray<this["Target"]>;
}

type Box<T> = { readonly value: T };
type Thunk<T> = () => T;
type HeadTail<T> = { readonly [P in "head" | "tail"]: T };
type PrefixedBox<T> = {
	readonly [K in keyof Box<T> as `box_${K & string}`]: Box<T>[K];
};
type WithId = { readonly id: number };

interface BoxLambda extends HKT.TypeLambda {
	readonly type: Box<this["Target"]>;
}

interface ThunkLambda extends HKT.TypeLambda {
	readonly type: Thunk<this["Target"]>;
}

interface HeadTailLambda extends HKT.TypeLambda {
	readonly type: HeadTail<this["Target"]>;
}

interface PrefixedBoxLambda extends HKT.TypeLambda {
	readonly type: PrefixedBox<this["Target"]>;
}

interface WithIdLambda extends HKT.TypeLambda {
	readonly Target: WithId;
	readonly type: this["Target"];
}

type SharedContext<In, Target> = { readonly shared: In; readonly own: Target };

interface SharedContextLambda extends HKT.TypeLambda {
	readonly type: SharedContext<this["In"], this["Target"]>;
}

class TransformError extends Schema.TaggedError<TransformError>()(
	"TransformError",
	{ key: Schema.String },
) {}

class BoxService extends Context.Service<
	BoxService,
	{ readonly box: <X>(value: X) => ReadonlyArray<X> }
>()("BoxService") {}

describe("mapValues", () => {
	const identitiesToArrays = mapValues<IdentityLambda, ArrayLambda>((value) => [
		value,
	]);

	test("applies the transform to every value, preserving keys and per-key value types", () => {
		const result = identitiesToArrays({ a: 1, b: "two" });
		expectTypeOf(result).toEqualTypeOf<{
			readonly a: ReadonlyArray<number>;
			readonly b: ReadonlyArray<string>;
		}>();
		expect(result).toEqual({ a: [1], b: ["two"] });
	});

	test("reuses one bound mapper across differently-shaped inputs, inferring each result independently", () => {
		const first = identitiesToArrays({ a: 1, b: "two" });
		const second = identitiesToArrays({ x: true });
		expectTypeOf(first).toEqualTypeOf<{
			readonly a: ReadonlyArray<number>;
			readonly b: ReadonlyArray<string>;
		}>();
		expectTypeOf(second).toEqualTypeOf<{
			readonly x: ReadonlyArray<boolean>;
		}>();
		expect(first).toEqual({ a: [1], b: ["two"] });
		expect(second).toEqual({ x: [true] });
	});

	test("passes the string key to the transform", () => {
		const keys: string[] = [];
		const recordKeys = mapValues<IdentityLambda, IdentityLambda>(
			(value, key) => {
				expectTypeOf(key).toEqualTypeOf<string>();
				keys.push(key);
				return value;
			},
		);
		recordKeys({ a: 1, b: 2 });
		expect(keys.sort()).toEqual(["a", "b"]);
	});

	test("returns an empty object for an empty input", () => {
		const result = identitiesToArrays({});
		expect(result).toEqual({});
	});

	test("returns a fresh object without mutating the input", () => {
		const input = { a: 1, b: 2 };
		const result = identitiesToArrays(input);
		expect(result).not.toBe(input);
		expect(input).toEqual({ a: 1, b: 2 });
	});

	test("maps each value into a mapped-object shape, keeping value types distinct per key", () => {
		const result = mapValues<IdentityLambda, HeadTailLambda>((value) => ({
			head: value,
			tail: value,
		}))({ a: 1, b: "two" });
		expectTypeOf(result).toEqualTypeOf<{
			readonly a: { readonly head: number; readonly tail: number };
			readonly b: { readonly head: string; readonly tail: string };
		}>();
		expect(result).toEqual({
			a: { head: 1, tail: 1 },
			b: { head: "two", tail: "two" },
		});
	});

	test("preserves distinct per-key return types when the transform produces functions", () => {
		const result = mapValues<IdentityLambda, ThunkLambda>(
			(value) => () => value,
		)({ count: 2, label: "x" });
		expectTypeOf(result).toEqualTypeOf<{
			readonly count: () => number;
			readonly label: () => string;
		}>();
		expect(result.count()).toBe(2);
		expect(result.label()).toBe("x");
	});

	test("reduces a non-identity F lambda on the input side", () => {
		const result = mapValues<BoxLambda, IdentityLambda>((value) => value.value)(
			{
				a: { value: 1 },
				b: { value: "two" },
			},
		);
		expectTypeOf(result).toEqualTypeOf<{
			readonly a: number;
			readonly b: string;
		}>();
		expect(result).toEqual({ a: 1, b: "two" });
	});

	test("rejects an input whose values do not match the F lambda", () => {
		mapValues<BoxLambda, IdentityLambda>((value) => value.value)(
			// @ts-expect-error values must be Box-shaped
			{ a: 1 },
		);
	});

	test("resolves a keyof-remapped, indexed mapped-object G lambda per key", () => {
		const result = mapValues<IdentityLambda, PrefixedBoxLambda>((value) => ({
			box_value: value,
		}))({ a: 1, b: "two" });
		expectTypeOf(result).toEqualTypeOf<{
			readonly a: { readonly box_value: number };
			readonly b: { readonly box_value: string };
		}>();
		expect(result).toEqual({ a: { box_value: 1 }, b: { box_value: "two" } });
	});

	test("respects a Lambda that specifies a constrained Target", () => {
		const boxWithIds = mapValues<WithIdLambda, BoxLambda>((value) => ({
			value,
		}));
		const result = boxWithIds({ a: { id: 1, tag: "x" }, b: { id: 2, tag: 9 } });
		expectTypeOf(result).toEqualTypeOf<{
			readonly a: { readonly value: { id: number; tag: string } };
			readonly b: { readonly value: { id: number; tag: number } };
		}>();
		expect(result).toEqual({
			a: { value: { id: 1, tag: "x" } },
			b: { value: { id: 2, tag: 9 } },
		});
		boxWithIds(
			// @ts-expect-error Target must satisfy { id: number }
			{ a: "no id" },
		);
	});

	describe("an object Target holding a union-bounded value", () => {
		type Shape = { readonly kind: "circle" } | { readonly kind: "square" };
		type Checked<S> = S extends { readonly kind: infer Kind }
			? [Kind] extends [unknown]
				? S
				: never
			: never;
		interface Tagged<S extends Shape> {
			readonly shape: Checked<S>;
		}
		type Tags<Shapes extends Record<string, Shape>> = {
			readonly [K in keyof Shapes & string]: Tagged<Shapes[K]>;
		};
		interface TaggedLambda extends HKT.TypeLambda {
			readonly Target: Tagged<Shape>;
			readonly type: this["Target"];
		}

		test("maps a generic record", () => {
			const box = <Shapes extends Record<string, Shape>>(
				tags: Tags<Shapes>,
			): { readonly [K in keyof Shapes & string]: Box<Tagged<Shapes[K]>> } =>
				mapValues<TaggedLambda, BoxLambda>((value) => ({ value }))<
					Tags<Shapes>
				>(tags);

			const result = box<{ a: { readonly kind: "circle" } }>({
				a: { shape: { kind: "circle" } },
			});

			expectTypeOf(result).toEqualTypeOf<{
				readonly a: Box<Tagged<{ readonly kind: "circle" }>>;
			}>();
			expect(result).toEqual({ a: { value: { shape: { kind: "circle" } } } });
		});

		test("rejects a generic record that belongs to other Targets", () => {
			const box = <
				Shapes extends Record<string, Shape>,
				Others extends Record<string, Shape>,
			>(
				tags: Tags<Others>,
			) =>
				mapValues<TaggedLambda, BoxLambda>((value) => ({ value }))<
					Tags<Shapes>
				>(
					// @ts-expect-error the tags belong to another record
					tags,
				);

			expectTypeOf(box).toBeFunction();
		});
	});
});

describe("mapEffectValues", () => {
	it.effect(
		"collects the resolved values into a record, with E and R never",
		() =>
			Effect.gen(function* () {
				const effect = mapEffectValues<IdentityLambda, ArrayLambda>()((value) =>
					Effect.succeed([value]),
				)({ a: 1, b: "two" });
				expectTypeOf(effect).toEqualTypeOf<
					Effect.Effect<
						{
							readonly a: ReadonlyArray<number>;
							readonly b: ReadonlyArray<string>;
						},
						never,
						never
					>
				>();
				expect(yield* effect).toEqual({ a: [1], b: ["two"] });
			}),
	);

	it.effect("passes the key to the transform", () =>
		Effect.gen(function* () {
			const keys: string[] = [];
			yield* mapEffectValues<IdentityLambda, ArrayLambda>()((value, key) => {
				keys.push(key);
				return Effect.succeed([value]);
			})({ a: 1, b: 2 });
			expect(keys.sort()).toEqual(["a", "b"]);
		}),
	);

	it.effect("maps nothing when the input is undefined", () =>
		Effect.gen(function* () {
			const keys: string[] = [];
			const input: Record<string, number> | undefined = undefined;

			const result = yield* mapEffectValues<IdentityLambda, ArrayLambda>()(
				(value, key) => {
					keys.push(key);
					return Effect.succeed([value]);
				},
			)(input);

			expect(result).toEqual({});
			expect(keys).toEqual([]);
		}),
	);

	it.effect("reduces a non-identity In lambda on the input side", () =>
		Effect.gen(function* () {
			const result = yield* mapEffectValues<BoxLambda, IdentityLambda>()(
				(value) => Effect.succeed(value.value),
			)({
				a: { value: 1 },
				b: { value: "two" },
			});
			expect(result).toEqual({ a: 1, b: "two" });
		}),
	);

	it.effect("propagates the transform's error channel", () =>
		Effect.gen(function* () {
			const effect = mapEffectValues<IdentityLambda, ArrayLambda>()(
				(value, key) =>
					key === "b"
						? Effect.fail(new TransformError({ key }))
						: Effect.succeed([value]),
			)({ a: 1, b: 2 });
			expectTypeOf(effect).toEqualTypeOf<
				Effect.Effect<
					{
						readonly a: ReadonlyArray<number>;
						readonly b: ReadonlyArray<number>;
					},
					TransformError,
					never
				>
			>();
			const error = yield* effect.pipe(Effect.flip);
			expect(error._tag).toBe("TransformError");
		}),
	);

	it.effect("propagates the transform's context channel", () =>
		Effect.gen(function* () {
			const effect = mapEffectValues<IdentityLambda, ArrayLambda>()((value) =>
				Effect.gen(function* () {
					const service = yield* BoxService;
					return service.box(value);
				}),
			)({ a: 1, b: 2 });
			expectTypeOf(effect).toEqualTypeOf<
				Effect.Effect<
					{
						readonly a: ReadonlyArray<number>;
						readonly b: ReadonlyArray<number>;
					},
					never,
					BoxService
				>
			>();
			const result = yield* effect.pipe(
				Effect.provideService(BoxService, {
					box: (value) => [value, value],
				}),
			);
			expect(result).toEqual({ a: [1, 1], b: [2, 2] });
		}),
	);

	it.effect(
		"maps into a mapped-object shape carrying both the error and context channels",
		() =>
			Effect.gen(function* () {
				const effect = mapEffectValues<IdentityLambda, HeadTailLambda>()(
					(value, key) =>
						key === "b"
							? Effect.fail(new TransformError({ key }))
							: Effect.gen(function* () {
									yield* BoxService;
									return { head: value, tail: value };
								}),
				)({ a: 1, b: 2 });
				expectTypeOf(effect).toEqualTypeOf<
					Effect.Effect<
						{
							readonly a: { readonly head: number; readonly tail: number };
							readonly b: { readonly head: number; readonly tail: number };
						},
						TransformError,
						BoxService
					>
				>();
				const error = yield* effect.pipe(
					Effect.provideService(BoxService, {
						box: (value) => [value, value],
					}),
					Effect.flip,
				);
				expect(error._tag).toBe("TransformError");
			}),
	);

	it.effect("returns an empty object for an empty input", () =>
		Effect.gen(function* () {
			const result = yield* mapEffectValues<IdentityLambda, ArrayLambda>()(
				(value) => Effect.succeed([value]),
			)({});
			expect(result).toEqual({});
		}),
	);
});

describe("zipEffectValues", () => {
	it.effect(
		"correlates obj and ctx by key, threading the shared In into each context",
		() =>
			Effect.gen(function* () {
				const shareds: string[] = [];
				const effect = zipEffectValues<
					IdentityLambda,
					SharedContextLambda,
					ArrayLambda,
					"v1",
					{ a: number; b: string }
				>()(
					{ a: 1, b: "two" },
					{ a: { shared: "v1", own: 10 }, b: { shared: "v1", own: "twenty" } },
					(value, context) => {
						shareds.push(context.shared);
						return Effect.succeed([value, context.own]);
					},
				);
				expectTypeOf(effect).toEqualTypeOf<
					Effect.Effect<
						{
							readonly a: ReadonlyArray<number>;
							readonly b: ReadonlyArray<string>;
						},
						never,
						never
					>
				>();
				expect(yield* effect).toEqual({ a: [1, 10], b: ["two", "twenty"] });
				expect(shareds).toEqual(["v1", "v1"]);
			}),
	);

	it.effect("returns an empty object when ctx is undefined, ignoring obj", () =>
		Effect.gen(function* () {
			const effect = zipEffectValues<
				IdentityLambda,
				SharedContextLambda,
				ArrayLambda,
				"v1",
				{ a: number; b: string }
			>()({ a: 1, b: "two" }, undefined, (value) => Effect.succeed([value]));
			expect(yield* effect).toEqual({});
		}),
	);

	it.effect("passes the key to the transform", () =>
		Effect.gen(function* () {
			const keys: string[] = [];
			yield* zipEffectValues<
				IdentityLambda,
				SharedContextLambda,
				ArrayLambda,
				"v1",
				{ a: number; b: number }
			>()(
				{ a: 1, b: 2 },
				{ a: { shared: "v1", own: 1 }, b: { shared: "v1", own: 2 } },
				(value, _context, key) => {
					keys.push(key);
					return Effect.succeed([value]);
				},
			);
			expect(keys.sort()).toEqual(["a", "b"]);
		}),
	);

	it.effect("propagates the transform's error channel", () =>
		Effect.gen(function* () {
			const effect = zipEffectValues<
				IdentityLambda,
				SharedContextLambda,
				ArrayLambda,
				"v1",
				{ a: number; b: number }
			>()(
				{ a: 1, b: 2 },
				{ a: { shared: "v1", own: 1 }, b: { shared: "v1", own: 2 } },
				(value, _context, key) =>
					key === "b"
						? Effect.fail(new TransformError({ key }))
						: Effect.succeed([value]),
			);
			expectTypeOf(effect).toEqualTypeOf<
				Effect.Effect<
					{
						readonly a: ReadonlyArray<number>;
						readonly b: ReadonlyArray<number>;
					},
					TransformError,
					never
				>
			>();
			const error = yield* effect.pipe(Effect.flip);
			expect(error._tag).toBe("TransformError");
		}),
	);

	it.effect("propagates the transform's context channel", () =>
		Effect.gen(function* () {
			const effect = zipEffectValues<
				IdentityLambda,
				SharedContextLambda,
				ArrayLambda,
				"v1",
				{ a: number; b: number }
			>()(
				{ a: 1, b: 2 },
				{ a: { shared: "v1", own: 1 }, b: { shared: "v1", own: 2 } },
				(value) =>
					Effect.gen(function* () {
						const service = yield* BoxService;
						return service.box(value);
					}),
			);
			expectTypeOf(effect).toEqualTypeOf<
				Effect.Effect<
					{
						readonly a: ReadonlyArray<number>;
						readonly b: ReadonlyArray<number>;
					},
					never,
					BoxService
				>
			>();
			const result = yield* effect.pipe(
				Effect.provideService(BoxService, {
					box: (value) => [value, value],
				}),
			);
			expect(result).toEqual({ a: [1, 1], b: [2, 2] });
		}),
	);
});

describe("mapNestedValues", () => {
	test("maps each inner value and keeps both key levels", () => {
		const result = mapNestedValues<number>()(
			{ a: { x: 1, y: 2 }, b: { z: 3 } },
			(value, outerKey) => `${outerKey}=${value}`,
		);

		expect(result).toStrictEqual({
			a: { x: "a=1", y: "a=2" },
			b: { z: "b=3" },
		});
	});

	test("keeps an optional inner key optional in the type", () => {
		const input: { readonly a: { readonly x?: number } } = { a: {} };

		const result = mapNestedValues<number>()(input, () => "mapped");

		expectTypeOf(result).toEqualTypeOf<{
			readonly a: { readonly x?: string };
		}>();
		expect(result).toStrictEqual({ a: {} });
	});

	test("transforms an inner value that is undefined", () => {
		const result = mapNestedValues<number>()(
			{ a: { x: 1, y: undefined } },
			(value) => (value ?? 0) + 1,
		);

		expectTypeOf(result).toEqualTypeOf<{
			readonly a: { readonly x: number; readonly y: number };
		}>();
		expect(result).toStrictEqual({ a: { x: 2, y: 1 } });
	});

	test("maps nothing when the input is undefined", () => {
		const result = mapNestedValues<number>()(undefined, (value) => value);

		expect(result).toStrictEqual({});
	});
});
