import { cloneJson, findInheritedKey } from "@nodecg-next/internal/utils";
import type { StandardSchemaV1 } from "@standard-schema/spec";
import { getDotPath } from "@standard-schema/utils";
import { Option, Result, Schema } from "effect";
import type { WritableDeep } from "type-fest";

const decodeJson = Schema.decodeUnknownResult(Schema.Json);

export class FieldEncodeError extends Schema.TaggedError<FieldEncodeError>()(
	"FieldEncodeError",
	{
		fieldName: Schema.String,
		value: Schema.Unknown,
		cause: Schema.instanceOf(Error),
	},
) {
	override readonly message = `Failed to encode replicant "${this.fieldName}": ${this.cause.message}`;
}

export class FieldDecodeError extends Schema.TaggedError<FieldDecodeError>()(
	"FieldDecodeError",
	{
		fieldName: Schema.String,
		value: Schema.Unknown,
		cause: Schema.instanceOf(Error),
	},
) {
	override readonly message = `Failed to decode replicant "${this.fieldName}": ${this.cause.message}`;
}

class SchemaDefect extends Schema.TaggedError<SchemaDefect>()("SchemaDefect", {
	cause: Schema.Defect(),
}) {
	override readonly message = "The schema threw instead of returning issues";
}

const makeEffectCodec = <D>(
	name: string,
	schema: Schema.Codec<D, Schema.Json>,
) => {
	const encodeSchema = Schema.encodeResult(schema);
	const decodeSchema = Schema.decodeResult(schema);
	return {
		encode: (value: D) =>
			Result.try({
				try: () => encodeSchema(value),
				catch: (cause) => SchemaDefect.make({ cause }),
			}).pipe(
				Result.flatMap((encoded) => encoded),
				Result.mapError((cause) =>
					FieldEncodeError.make({ fieldName: name, value, cause }),
				),
			),
		decode: (value: Schema.Json) =>
			Result.try({
				try: () => decodeSchema(value),
				catch: (cause) => SchemaDefect.make({ cause }),
			}).pipe(
				Result.flatMap((decoded) => decoded),
				Result.mapError((cause) =>
					FieldDecodeError.make({ fieldName: name, value, cause }),
				),
			),
	};
};

class SchemaIssues extends Schema.TaggedError<SchemaIssues>()("SchemaIssues", {
	issues: Schema.Array(Schema.String),
}) {
	override readonly message = this.issues.join("\n");
}

const standardSchemaValidator =
	<D>(schema: StandardSchemaV1<unknown, D>) =>
	(value: unknown): Result.Result<D, SchemaIssues | SchemaDefect> => {
		const validation = Result.try({
			try: () => schema["~standard"].validate(value),
			catch: (cause) => SchemaDefect.make({ cause }),
		});
		if (Result.isFailure(validation)) {
			return Result.fail(validation.failure);
		}
		const result = validation.success;
		if (result instanceof Promise) {
			return Result.fail(
				SchemaIssues.make({ issues: ["The schema validated asynchronously"] }),
			);
		}
		if (result.issues) {
			return Result.fail(
				SchemaIssues.make({
					issues: result.issues.map((issue) => {
						const path = getDotPath(issue);
						return path === null ? issue.message : `${path}: ${issue.message}`;
					}),
				}),
			);
		}
		return Result.succeed(result.value);
	};

const makeStandardCodec = <D>(
	name: string,
	schema: StandardSchemaV1<unknown, D>,
) => {
	const validate = standardSchemaValidator(schema);
	return {
		encode: (value: D) =>
			validate(value).pipe(
				Result.flatMap(decodeJson),
				Result.mapError((cause) =>
					FieldEncodeError.make({ fieldName: name, value, cause }),
				),
			),
		decode: (value: Schema.Json) =>
			validate(value).pipe(
				Result.mapError((cause) =>
					FieldDecodeError.make({ fieldName: name, value, cause }),
				),
			),
	};
};

export interface FieldCodec<D> {
	readonly encode: (
		value: D | WritableDeep<D>,
	) => Result.Result<Schema.Json, FieldEncodeError>;
	readonly decode: (value: Schema.Json) => Result.Result<D, FieldDecodeError>;
	readonly mutableDecode: (
		value: Schema.Json,
	) => Result.Result<WritableDeep<D>, FieldDecodeError>;
}

export function makeCodec<D>(
	name: string,
	schema: Schema.Codec<D, Schema.Json> | StandardSchemaV1<unknown, D>,
): FieldCodec<D> {
	const codec = Schema.isSchema(schema)
		? makeEffectCodec(name, schema)
		: makeStandardCodec(name, schema);
	const decode = (value: Schema.Json) => {
		const inheritedKey = findInheritedKey(value);
		if (Option.isSome(inheritedKey)) {
			return Result.fail(
				FieldDecodeError.make({
					fieldName: name,
					value,
					cause: new Error(
						`Object key "${inheritedKey.value}" is a name every object inherits`,
					),
				}),
			);
		}
		return codec.decode(value);
	};
	return {
		encode: (value: D | WritableDeep<D>) =>
			// Asserting mutable object as immutable is safe in this context
			codec.encode(value as D).pipe(
				Result.flatMap((encoded) => {
					const inheritedKey = findInheritedKey(encoded);
					if (Option.isSome(inheritedKey)) {
						return Result.fail(
							FieldEncodeError.make({
								fieldName: name,
								value,
								cause: new Error(
									`Object key "${inheritedKey.value}" is a name every object inherits`,
								),
							}),
						);
					}
					return Result.succeed(encoded);
				}),
			),
		decode,
		mutableDecode: (value: Schema.Json) =>
			// Decode a copy because a schema may hand back parts of its input, so the result is safe to assert as mutable
			decode(cloneJson(value)).pipe(
				Result.map((decoded) => decoded as WritableDeep<D>),
			),
	};
}
