import fs from "node:fs";
import path from "node:path";

import chalk from "chalk";
import { Command } from "commander";
import { compileFromFile } from "json-schema-to-typescript";

export function schemaTypesCommand(program: Command) {
	program
		.command("schema-types [dir]")
		.option(
			"-o, --out-dir [path]",
			"Where to put the generated d.ts files",
			"src/types/schemas",
		)
		.option(
			"--no-config-schema",
			"Don't generate a typedef from configschema.json",
		)
		.description(
			"Generate d.ts TypeScript typedef files from Replicant schemas and configschema.json (if present)",
		)
		.action(action);
}

function action(inDir: string, cmd: { outDir: string; configSchema: boolean }) {
	const processCwd = process.cwd();
	const schemasDir = path.resolve(processCwd, inDir || "schemas");
	if (!fs.existsSync(schemasDir)) {
		console.error(`${chalk.red("Error:")} Input directory does not exist`);
		return;
	}

	const outDir = path.resolve(processCwd, cmd.outDir);
	if (!fs.existsSync(outDir)) {
		fs.mkdirSync(outDir, { recursive: true });
	}

	const configSchemaPath = path.join(processCwd, "configschema.json");
	const schemas = fs.readdirSync(schemasDir).filter((f) => f.endsWith(".json"));

	const style = {
		singleQuote: true,
		useTabs: true,
	};

	const compilePromises: Promise<void>[] = [];
	const compile = (input: string, output: string, cwd = processCwd) => {
		const promise = compileFromFile(input, {
			cwd,
			declareExternallyReferenced: true,
			enableConstEnums: true,
			style,
		})
			.then((ts) =>
				fs.promises.writeFile(output, "/* prettier-ignore */\n" + ts),
			)
			.then(() => {
				console.log(output);
			})
			.catch((err: unknown) => {
				console.error(err);
			});
		compilePromises.push(promise);
	};

	if (fs.existsSync(configSchemaPath) && cmd.configSchema) {
		compile(configSchemaPath, path.resolve(outDir, "configschema.d.ts"));
	}

	for (const schema of schemas) {
		compile(
			path.resolve(schemasDir, schema),
			path.resolve(outDir, schema.replace(/\.json$/i, ".d.ts")),
			schemasDir,
		);
	}

	return Promise.all(compilePromises).then(() => {
		(process.emit as any)("schema-types-done");
	});
}
