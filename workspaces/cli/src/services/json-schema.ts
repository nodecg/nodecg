import { Effect, Data } from "effect";
import { FileSystemService } from "./file-system.js";
import Ajv from "ajv";
import { compileFromFile } from "json-schema-to-typescript";

export class JsonSchemaError extends Data.TaggedError("JsonSchemaError")<{
	readonly message: string;
	readonly schemaPath?: string;
}> {}

const AjvConstructor = Ajv as unknown as {
	new (options: { useDefaults: boolean; strict: boolean }): typeof Ajv.prototype;
};
const ajv = new AjvConstructor({ useDefaults: true, strict: true });

export class JsonSchemaService extends Effect.Service<JsonSchemaService>()(
	"JsonSchemaService",
	{
		effect: Effect.gen(function* () {
			const fs = yield* FileSystemService;

			return {
				applyDefaults: (schemaPath: string) =>
					Effect.gen(function* () {
						const schemaContent = yield* fs.readFileString(schemaPath).pipe(
							Effect.mapError(
								() =>
									new JsonSchemaError({
										message: `Failed to read schema`,
										schemaPath,
									}),
							),
						);

						const schema = JSON.parse(schemaContent);
						const validate = ajv.compile(schema);
						const data = {};
						const valid = validate(data);

						if (!valid) {
							return yield* Effect.fail(
								new JsonSchemaError({
									message: `Schema validation failed`,
									schemaPath,
								}),
							);
						}

						return data;
					}),

				validate: (data: unknown, schemaPath: string) =>
					Effect.gen(function* () {
						const schemaContent = yield* fs.readFileString(schemaPath).pipe(
							Effect.mapError(
								() =>
									new JsonSchemaError({
										message: `Failed to read schema`,
										schemaPath,
									}),
							),
						);

						const schema = JSON.parse(schemaContent);
						const validate = ajv.compile(schema);
						const valid = validate(data);

						if (!valid) {
							return yield* Effect.fail(
								new JsonSchemaError({
									message: `Validation failed`,
									schemaPath,
								}),
							);
						}
					}),

				compileToTypeScript: (
					schemaPath: string,
					outputPath: string,
					options?: {
						cwd?: string;
						style?: { singleQuote?: boolean; useTabs?: boolean };
					},
				) =>
					Effect.gen(function* () {
						const ts = yield* Effect.promise(() =>
							compileFromFile(schemaPath, {
								cwd: options?.cwd,
								declareExternallyReferenced: true,
								enableConstEnums: true,
								style: options?.style,
							}),
						).pipe(
							Effect.mapError(
								() =>
									new JsonSchemaError({
										message: `Failed to compile schema`,
										schemaPath,
									}),
							),
						);

						yield* fs
							.writeFileString(outputPath, "/* prettier-ignore */\n" + ts)
							.pipe(
								Effect.mapError(
									() =>
										new JsonSchemaError({
											message: `Failed to write output`,
											schemaPath,
										}),
								),
							);
					}),
			};
		}),
	},
) {}
