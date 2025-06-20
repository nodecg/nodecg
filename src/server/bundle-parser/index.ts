import path from "node:path";

import { Effect, Option, pipe } from "effect";

import type { NodeCG } from "../../types/nodecg";
import { readJsonFileSync } from "../util-fp/read-json-file-sync";
import { parseAssets } from "./assets";
import { parseBundleConfig, parseDefaults } from "./config";
import { parseExtension } from "./extension";
import { parseGit } from "./git";
import { parseGraphics } from "./graphics";
import { parseManifest } from "./manifest";
import { parseMounts } from "./mounts";
import { parsePanels } from "./panels";
import { parseSounds } from "./sounds";

const readBundlePackageJson = (
	bundlePath: string,
): Effect.Effect<NodeCG.PackageJSON, Error> =>
	pipe(
		path.join(bundlePath, "package.json"),
		readJsonFileSync,
		Effect.map((json) => json as NodeCG.PackageJSON),
		Effect.mapError((error) => {
			if ((error as NodeJS.ErrnoException).code === "ENOENT") {
				return new Error(
					`Bundle at path ${bundlePath} does not contain a package.json!`,
				);
			}
			if (error instanceof SyntaxError) {
				return new Error(
					`${bundlePath}'s package.json is not valid JSON, please check it against a validator such as jsonlint.com`,
				);
			}
			return error;
		}),
	);

const parseBundleNodecgConfig = (
	bundlePath: string,
): Effect.Effect<NodeCG.NodecgBundleConfig, Error> =>
	pipe(
		path.join(bundlePath, "nodecg.config.js"),
		(configPath) =>
			Effect.try({
				try: () => require(configPath),
				catch: (error) =>
					error instanceof Error ? error : new Error(String(error)),
			}),
		Effect.catchAll(() => Effect.succeed({})),
		Effect.map((config) => config.default || config),
		Effect.flatMap((config) => {
			if (
				typeof config !== "object" ||
				config === null ||
				Array.isArray(config)
			) {
				return Effect.fail(new Error("nodecg.config.js must export an object"));
			}
			return Effect.succeed(config as NodeCG.NodecgBundleConfig);
		}),
	);

export const parseBundle = (
	bundlePath: string,
	bundleCfg?: NodeCG.Bundle.UnknownConfig,
): NodeCG.Bundle => {
	const manifest = pipe(
		readBundlePackageJson(bundlePath),
		Effect.flatMap(parseManifest(bundlePath)),
		Effect.runSync,
	);

	const dashboardDir = path.resolve(bundlePath, "dashboard");
	const graphicsDir = path.resolve(bundlePath, "graphics");

	const nodecgBundleConfig = Effect.runSync(
		parseBundleNodecgConfig(bundlePath),
	);

	const config = pipe(
		Option.fromNullable(bundleCfg),
		Option.match({
			onNone: () => parseDefaults(manifest.name)(bundlePath),
			onSome: (bundleCfg) =>
				Effect.try({
					try: () => parseBundleConfig(manifest.name, bundlePath, bundleCfg),
					catch: (error) =>
						error instanceof Error ? error : new Error(String(error)),
				}),
		}),
		Effect.runSync,
	);

	const bundle: NodeCG.Bundle = {
		...manifest,
		dir: bundlePath,
		config,
		dashboard: {
			dir: dashboardDir,
			panels: parsePanels(dashboardDir, manifest),
		},
		mount: parseMounts(manifest),
		graphics: parseGraphics(graphicsDir, manifest),
		assetCategories: parseAssets(manifest),
		hasExtension: parseExtension(bundlePath, manifest),
		git: parseGit(bundlePath),
		...parseSounds(bundlePath, manifest),
		nodecgBundleConfig,
	};

	return bundle;
};
