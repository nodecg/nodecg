import path from "node:path";

import * as E from "fp-ts/Either";
import { flow, pipe } from "fp-ts/function";
import * as IOE from "fp-ts/IOEither";
import * as O from "fp-ts/Option";

import type { NodeCG } from "../../types/nodecg";
import { readFileSync } from "../util-fp/fs/read-file-sync";
import { parseJson } from "../util-fp/parse-json";
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
		bundlePath,
		(bundlePath: string) => path.join(bundlePath, "package.json"),
		readFileSync,
		IOE.flatMap(flow(parseJson, IOE.fromEither)),
		IOE.map((json) => json as NodeCG.PackageJSON),
		IOE.mapLeft((error) => {
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

	const config = pipe(
		bundleCfg,
		O.fromNullable,
		O.match(
			() => parseDefaults(manifest.name)(bundlePath),
			IOE.tryCatchK(
				(bundleCfg) => parseBundleConfig(manifest.name, bundlePath, bundleCfg),
				E.toError,
			),
		),
		IOE.getOrElse((error) => {
			throw error;
		}),
	)();

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
