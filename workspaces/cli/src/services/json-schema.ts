import Ajv from "ajv";
import { Data, Effect } from "effect";
import { compileFromFile } from "json-schema-to-typescript";

import { FileSystemService } from "./file-system.js";

export class JsonSchemaError extends Data.TaggedError("JsonSchemaError")<{
	readonly message: string;
	readonly schemaPath?: string;
}> {}

const ajv = new (Ajv as any)({ useDefaults: true, strict: true });

export class JsonSchemaService extends Effect.Service<JsonSchemaService>()(
	"JsonSchemaService",
	{
		effect: Effect.gen(function* () {
			const fs = yield* FileSystemService;

			return {
				applyDefaults: Effect.fn("applyDefaults")(function* (
					schemaPath: string,
				) {
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

				validate: Effect.fn("validate")(function* (
					data: unknown,
					schemaPath: string,
				) {
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

				compileToTypeScript: Effect.fn("compileToTypeScript")(function* (
					schemaPath: string,
					outputPath: string,
					options?: {
						cwd?: string;
						style?: { singleQuote?: boolean; useTabs?: boolean };
					},
				) {
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
		dependencies: [FileSystemService.Default],
	},
) {}
