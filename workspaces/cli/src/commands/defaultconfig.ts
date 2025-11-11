import { Effect } from "effect";
import { Command, Args } from "@effect/cli";
import { FileSystemService } from "../services/file-system.js";
import { TerminalService } from "../services/terminal.js";
import { PathService } from "../services/path.js";
import { JsonSchemaService } from "../services/json-schema.js";
import path from "node:path";

export const defaultconfigCommand = Command.make(
	"defaultconfig",
	{
		bundle: Args.text({ name: "bundle" }).pipe(Args.optional),
	},
	({ bundle: bundleName }) =>
		Effect.fn("defaultconfigCommand")(function* () {
			const fs = yield* FileSystemService;
			const terminal = yield* TerminalService;
			const pathService = yield* PathService;
			const jsonSchema = yield* JsonSchemaService;

			const cwd = process.cwd();
			const nodecgPath = yield* pathService.getNodeCGPath();

			let finalBundleName = bundleName;
			if (!finalBundleName) {
				const isBundle = yield* pathService.isBundleFolder(cwd);
				if (isBundle) {
					finalBundleName = path.basename(cwd);
				} else {
					yield* terminal.writeError(
						"Error: No bundle found in the current directory!",
					);
					return;
				}
			}

			const bundlePath = path.join(nodecgPath, "bundles", finalBundleName);
			const schemaPath = path.join(bundlePath, "configschema.json");
			const cfgPath = path.join(nodecgPath, "cfg");

			const bundleExists = yield* fs.exists(bundlePath);
			if (!bundleExists) {
				yield* terminal.writeError(
					`Error: Bundle ${finalBundleName} does not exist`,
				);
				return;
			}

			const schemaExists = yield* fs.exists(schemaPath);
			if (!schemaExists) {
				yield* terminal.writeError(
					`Error: Bundle ${finalBundleName} does not have a configschema.json`,
				);
				return;
			}

			const cfgExists = yield* fs.exists(cfgPath);
			if (!cfgExists) {
				yield* fs.mkdir(cfgPath);
			}

			const configPath = path.join(cfgPath, `${finalBundleName}.json`);
			const configExists = yield* fs.exists(configPath);

			if (configExists) {
				yield* terminal.writeError(
					`Error: Bundle ${finalBundleName} already has a config file`,
				);
			} else {
				const data = yield* jsonSchema.applyDefaults(schemaPath);
				yield* fs.writeJson(configPath, data);
				yield* terminal.writeSuccess(
					`Success: Created ${finalBundleName}'s default config from schema\n`,
				);
			}
		}),
);
