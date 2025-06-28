import path from "node:path";

import { Either, Option, pipe } from "effect";

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

const readBundlePackageJson = (bundlePath: string) =>
	pipe(
		path.join(bundlePath, "package.json"),
		readJsonFileSync,
		Either.map((json) => json as NodeCG.PackageJSON),
		Either.mapLeft((error) => {
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

const parseBundleNodecgConfig = (bundlePath: string) =>
	pipe(
		Either.try({
			try: () => require(path.join(bundlePath, "nodecg.config.js")),
			catch: (error) => {
				if (error instanceof Error) {
					return error;
				}
				return new Error(
					`Failed to load nodecg.config.js for bundle at ${bundlePath}: ${String(error)}`,
				);
			},
		}),
		Either.match({
			onLeft: () => ({}),
			onRight: (config) => config.default || config,
		}),
		Either.flatMap((config) => {
			if (
				typeof config !== "object" ||
				config === null ||
				Array.isArray(config)
			) {
				return Either.left(new Error("nodecg.config.js must export an object"));
			}
			return Either.right(config as NodeCG.NodecgBundleConfig);
		}),
	);

export const parseBundle = (
	bundlePath: string,
	bundleCfg?: NodeCG.Bundle.UnknownConfig,
): NodeCG.Bundle => {
	const manifest = pipe(
		readBundlePackageJson(bundlePath),
		Either.flatMap(parseManifest(bundlePath)),
		Either.getOrThrow,
	);

	const dashboardDir = path.resolve(bundlePath, "dashboard");
	const graphicsDir = path.resolve(bundlePath, "graphics");

	const nodecgBundleConfig = pipe(
		parseBundleNodecgConfig(bundlePath),
		Either.getOrThrow,
	);

	const config = pipe(
		Option.fromNullable(bundleCfg),
		Option.match({
			onNone: () => parseDefaults(manifest.name)(bundlePath),
			onSome: (bundleCfg) =>
				Either.try({
					try: () => parseBundleConfig(manifest.name, bundlePath, bundleCfg),
					catch: (error) => {
						if (error instanceof Error) {
							return error;
						}
						return new Error(
							`Failed to parse bundle config for ${manifest.name}: ${String(error)}`,
						);
					},
				}),
		}),
		Either.getOrThrow,
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
