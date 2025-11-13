import path from "node:path";

import { Args, Command } from "@effect/cli";
import { rootPaths } from "@nodecg/internal-util";
import { Effect, Option, Schema } from "effect";

import { FileSystemService } from "../services/file-system.js";
import { JsonSchemaService } from "../services/json-schema.js";
import { PathService } from "../services/path.js";
import { TerminalService } from "../services/terminal.js";

const PackageJsonSchema = Schema.Struct({
	name: Schema.String,
	version: Schema.String,
	nodecg: Schema.optional(Schema.Unknown),
});

export const defaultconfigCommand = Command.make(
	"defaultconfig",
	{
		bundle: Args.text({ name: "bundle" }).pipe(Args.optional),
	},
	({ bundle: bundleName }) =>
		Effect.gen(function* () {
			const fs = yield* FileSystemService;
			const terminal = yield* TerminalService;
			const pathService = yield* PathService;
			const jsonSchema = yield* JsonSchemaService;

			const cwd = process.cwd();
			const rootPath = rootPaths.getRuntimeRoot();

			// Helper to get bundle path (checks root first, then bundles dir)
			const getBundlePath = Effect.fn("getBundlePath")(function* (
				name: string,
			) {
				// Check if root project itself is the bundle
				const rootIsBundle = yield* pathService.isBundleFolder(rootPath);
				if (rootIsBundle) {
					const rootPjsonPath = path.join(rootPath, "package.json");
					const rootPjsonExists = yield* fs.exists(rootPjsonPath);
					if (rootPjsonExists) {
						const rootPjson = yield* fs.readJson(
							rootPjsonPath,
							PackageJsonSchema,
						);
						if (rootPjson.name === name) {
							return rootPath;
						}
					}
				}

				// Otherwise check bundles directory
				const bundlesPath = path.join(rootPath, "bundles", name);
				const bundlesPathIsBundle =
					yield* pathService.isBundleFolder(bundlesPath);
				if (bundlesPathIsBundle) {
					return bundlesPath;
				}

				return yield* Effect.fail(new Error(`Bundle ${name} not found`));
			});

			const finalBundleName = yield* Option.match(bundleName, {
				onNone: Effect.fn("onNone")(function* () {
					// Check if cwd is a bundle
					const isCwdBundle = yield* pathService.isBundleFolder(cwd);
					if (isCwdBundle) {
						const pjsonPath = path.join(cwd, "package.json");
						const pjson = yield* fs.readJson(pjsonPath, PackageJsonSchema);
						return pjson.name;
					}

					// Check if root project is a bundle (installed mode)
					const isRootBundle = yield* pathService.isBundleFolder(rootPath);
					if (isRootBundle) {
						const pjsonPath = path.join(rootPath, "package.json");
						const pjson = yield* fs.readJson(pjsonPath, PackageJsonSchema);
						return pjson.name;
					}

					yield* terminal.writeError(
						"Error: No bundle found in the current directory!",
					);
					return yield* Effect.fail(
						new Error("No bundle found in current directory"),
					);
				}),
				onSome: (name) => Effect.succeed(name),
			});

			const bundlePath = yield* getBundlePath(finalBundleName).pipe(
				Effect.catchAll(() =>
					Effect.gen(function* () {
						yield* terminal.writeError(
							`Error: Bundle ${finalBundleName} does not exist`,
						);
						return yield* Effect.fail(new Error("Bundle not found"));
					}),
				),
			);

			const schemaPath = path.join(bundlePath, "configschema.json");
			const cfgPath = path.join(rootPath, "cfg");

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
