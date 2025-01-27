import path from "node:path";

import E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/function";
import IOE from "fp-ts/IOEither";

import type { NodeCG } from "../../types/nodecg";
import { parseJson, ParseJsonError } from "../util-fp/parse-json";
import { NotExistError, readFileSync } from "../util-fp/read-file-sync";
import { parseAssets } from "./assets";
import { parseBundleConfig, parseDefaults } from "./config";
import { parseExtension } from "./extension";
import { parseGit } from "./git";
import { parseGraphics } from "./graphics";
import { parseManifest } from "./manifest";
import { parseMounts } from "./mounts";
import { parsePanels } from "./panels";
import { parseSounds } from "./sounds";

const parsePackageJson = (bundlePath: string) =>
	flow(
		parseJson,
		IOE.map((json) => json as NodeCG.PackageJSON),
		IOE.mapLeft((error) => {
			if (error instanceof SyntaxError) {
				return new Error(
					`${bundlePath}'s package.json is not valid JSON, please check it against a validator such as jsonlint.com`,
				);
			}
			return error;
		}),
	);

const readBundlePackageJson = (bundlePath: string) =>
	pipe(
		bundlePath,
		(bundlePath: string) => path.join(bundlePath, "package.json"),
		readFileSync,
		IOE.flatMap(parsePackageJson(bundlePath)),
		IOE.mapLeft((error) => {
			if (error instanceof NotExistError) {
				return new Error(
					`Bundle at path ${bundlePath} does not contain a package.json!`,
				);
			}
			if (error instanceof ParseJsonError) {
				return new Error(
					`${bundlePath}'s package.json is not valid JSON, please check it against a validator such as jsonlint.com`,
				);
			}
			return error;
		}),
	);

const parseBundleNodecgConfig = flow(
	(bundlePath: string) => path.join(bundlePath, "nodecg.config.js"),
	IOE.tryCatchK(require, E.toError),
	IOE.match(
		() => ({}),
		(config) => config.default || config,
	),
	IOE.fromIO,
	IOE.flatMap((config) => {
		if (
			typeof config !== "object" ||
			config === null ||
			Array.isArray(config)
		) {
			return IOE.left(new Error("nodecg.config.js must export an object"));
		}
		return IOE.right(config as NodeCG.NodecgBundleConfig);
	}),
);

export const parseBundle = (
	bundlePath: string,
	bundleCfg?: NodeCG.Bundle.UnknownConfig,
): NodeCG.Bundle => {
	const manifest = pipe(
		bundlePath,
		readBundlePackageJson,
		IOE.flatMap(parseManifest(bundlePath)),
		IOE.getOrElse((error) => {
			throw error;
		}),
	)();

	const dashboardDir = path.resolve(bundlePath, "dashboard");
	const graphicsDir = path.resolve(bundlePath, "graphics");

	const nodecgBundleConfig = pipe(
		parseBundleNodecgConfig(bundlePath),
		IOE.getOrElse((error) => {
			throw error;
		}),
	)();

	// If there is a config file for this bundle, parse it.
	// Else if there is only a configschema for this bundle, parse that and apply any defaults.
	const config = bundleCfg
		? parseBundleConfig(manifest.name, bundlePath, bundleCfg)
		: parseDefaults(manifest.name, bundlePath);

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
