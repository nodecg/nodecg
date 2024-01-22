// Native
import * as path from 'path';
import * as fs from 'fs';
import { cosmiconfigSync as cosmiconfig } from 'cosmiconfig';

// Ours
import parsePanels from './panels';
import parseMounts from './mounts';
import parseGraphics from './graphics';
import parseManifest from './manifest';
import parseAssets from './assets';
import parseSounds from './sounds';
import * as config from './config';
import parseExtension from './extension';
import parseGit from './git';
import type { NodeCG } from '../../types/nodecg';

/**
 * Determines which config file to use for a bundle.
 */
function loadBundleCfg(cfgDir: string, bundleName: string): NodeCG.Bundle.UnknownConfig | undefined {
	try {
		const cc = cosmiconfig('nodecg', {
			searchPlaces: [
				`${bundleName}.json`,
				`${bundleName}.yaml`,
				`${bundleName}.yml`,
				`${bundleName}.js`,
				`${bundleName}.config.js`,
			],
			stopDir: cfgDir,
		});
		const result = cc.search(cfgDir);
		return result?.config;
	} catch (_: unknown) {
		throw new Error(
			`Config for bundle "${bundleName}" could not be read. Ensure that it is valid JSON, YAML, or CommonJS.`,
		);
	}
}

export default function (bundlePath: string, cfgDir?: string | NodeCG.Bundle.UnknownConfig): NodeCG.Bundle {
	const bundleCfg = typeof cfgDir === 'string' ? loadBundleCfg(cfgDir, path.basename(bundlePath)) : cfgDir;

	// Resolve the path to the bundle and its package.json
	const pkgPath = path.join(bundlePath, 'package.json');

	if (!fs.existsSync(pkgPath)) {
		throw new Error(`Bundle at path ${bundlePath} does not contain a package.json!`);
	}

	// Read metadata from the package.json
	let pkg: NodeCG.PackageJSON;
	try {
		pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
	} catch (_: unknown) {
		throw new Error(`${pkgPath} is not valid JSON, please check it against a validator such as jsonlint.com`);
	}

	const dashboardDir = path.resolve(bundlePath, 'dashboard');
	const graphicsDir = path.resolve(bundlePath, 'graphics');
	const manifest = parseManifest(pkg, bundlePath);
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
	};

	return bundle;
}
