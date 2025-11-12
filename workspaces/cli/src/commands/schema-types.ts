import { Effect, Option } from "effect";
import { Command, Args, Options } from "@effect/cli";
import { FileSystemService } from "../services/file-system.js";
import { TerminalService } from "../services/terminal.js";
import { JsonSchemaService } from "../services/json-schema.js";
import path from "node:path";

export const schemaTypesCommand = Command.make(
	"schema-types",
	{
		dir: Args.text({ name: "dir" }).pipe(Args.optional),
		outDir: Options.text("out-dir").pipe(
			Options.withAlias("o"),
			Options.withDefault("src/types/schemas"),
		),
		configSchema: Options.boolean("config-schema").pipe(
			Options.withDefault(true),
		),
	},
	({ dir: inDir, outDir: outDirOption, configSchema }) =>
		Effect.gen(function* () {
			const fs = yield* FileSystemService;
			const terminal = yield* TerminalService;
			const jsonSchema = yield* JsonSchemaService;

			const processCwd = process.cwd();
			const schemasDir = path.resolve(
				processCwd,
				Option.getOrElse(inDir, () => "schemas"),
			);

			const schemasDirExists = yield* fs.exists(schemasDir);
			if (!schemasDirExists) {
				yield* terminal.writeError("Error: Input directory does not exist");
				return;
			}

			const outDir = path.resolve(processCwd, outDirOption);
			const outDirExists = yield* fs.exists(outDir);
			if (!outDirExists) {
				yield* fs.mkdir(outDir, { recursive: true });
			}

			const configSchemaPath = path.join(processCwd, "configschema.json");
			const files = yield* fs.readdir(schemasDir);
			const schemas = files.filter((f: string) => f.endsWith(".json"));

			const style = {
				singleQuote: true,
				useTabs: true,
			};

			const compile = (input: string, output: string, cwd = processCwd) =>
				Effect.gen(function* () {
					yield* jsonSchema.compileToTypeScript(input, output, { cwd, style });
					yield* terminal.writeLine(output);
				});

			const compilePromises: Array<Effect.Effect<void, unknown, unknown>> = [];

			if (configSchema) {
				const configSchemaExists = yield* fs.exists(configSchemaPath);
				if (configSchemaExists) {
					compilePromises.push(
						compile(configSchemaPath, path.resolve(outDir, "configschema.d.ts")),
					);
				}
			}

			for (const schema of schemas) {
				compilePromises.push(
					compile(
						path.resolve(schemasDir, schema),
						path.resolve(outDir, schema.replace(/\.json$/i, ".d.ts")),
						schemasDir,
					),
				);
			}

			yield* Effect.all(compilePromises, { concurrency: "unbounded" });

			yield* Effect.sync(() => {
				(process.emit as unknown as (event: string) => void)("schema-types-done");
			});
		}),
);
