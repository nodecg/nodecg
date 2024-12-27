import * as fs from "fs";
import * as path from "path";

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

export function parseBundle(
	bundlePath: string,
	bundleCfg?: NodeCG.Bundle.UnknownConfig,
): NodeCG.Bundle {
	// Resolve the path to the bundle and its package.json
	const pkgPath = path.join(bundlePath, "package.json");

	if (!fs.existsSync(pkgPath)) {
		throw new Error(
			`Bundle at path ${bundlePath} does not contain a package.json!`,
		);
	}

	// Read metadata from the package.json
	let pkg: NodeCG.PackageJSON;
	try {
		pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
	} catch (_: unknown) {
		throw new Error(
			`${pkgPath} is not valid JSON, please check it against a validator such as jsonlint.com`,
		);
	}

	const dashboardDir = path.resolve(bundlePath, "dashboard");
	const graphicsDir = path.resolve(bundlePath, "graphics");
	const manifest = parseManifest(pkg, bundlePath);

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
