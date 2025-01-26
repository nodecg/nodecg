import fs from "node:fs";
import path from "node:path";

import E from "fp-ts/Either";
import { pipe } from "fp-ts/function";
import IOE from "fp-ts/IOEither";

import type { NodeCG } from "../../types/nodecg";
import { parseAssets } from "./assets";
import * as config from "./config";
import { parseExtension } from "./extension";
import { parseGit } from "./git";
import { parseGraphics } from "./graphics";
import { parseManifest } from "./manifest";
import { parseMounts } from "./mounts";
import { parsePanels } from "./panels";
import { parseSounds } from "./sounds";

const readBundlePackageJson = (bundlePath: string) =>
	IOE.tryCatch(
		() => {
			const packageJsonPath = path.join(bundlePath, "package.json");
			// TODO: separate JSON.parse and fs.readFileSync into separate IOEither
			const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
			return packageJson as NodeCG.PackageJSON;
		},
		(error) => {
			if (!(error instanceof Error)) {
				return new Error("Unknown error");
			}
			if ("code" in error && error.code === "ENOENT") {
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
		},
	);

export function parseBundle(
	bundlePath: string,
	bundleCfg?: NodeCG.Bundle.UnknownConfig,
): NodeCG.Bundle {
	const manifestResult = pipe(
		readBundlePackageJson(bundlePath),
		IOE.flatMap(parseManifest(bundlePath)),
	)();

	if (E.isLeft(manifestResult)) {
		throw manifestResult.left;
	}

	const manifest = manifestResult.right;

	const dashboardDir = path.resolve(bundlePath, "dashboard");
	const graphicsDir = path.resolve(bundlePath, "graphics");

	let nodecgBundleConfig: NodeCG.NodecgBundleConfig;
	try {
		const importedConfig = require(path.join(bundlePath, "nodecg.config.js"));
		nodecgBundleConfig = importedConfig.default || importedConfig;
	} catch {
		nodecgBundleConfig = {};
	}
	if (typeof nodecgBundleConfig !== "object") {
		throw new Error("nodecg.config.js must export an object");
	}

	const bundle: NodeCG.Bundle = {
		...manifest,
		dir: bundlePath,

		// If there is a config file for this bundle, parse it.
		// Else if there is only a configschema for this bundle, parse that and apply any defaults.
		config: bundleCfg
			? config.parse(manifest.name, bundlePath, bundleCfg)
			: config.parseDefaults(manifest.name, bundlePath),

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
}
