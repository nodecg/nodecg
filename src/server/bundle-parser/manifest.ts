import * as path from "path";
import * as semver from "semver";

import type { NodeCG } from "../../types/nodecg";
import { Logger } from "../logger";

const logger = new Logger("bundle-parser/manifest");

export function parseManifest(
	pkg: NodeCG.PackageJSON,
	bundlePath: string,
): NodeCG.Manifest {
	if (!semver.valid(pkg.version)) {
		throw new Error(`${pkg.name}'s package.json must specify a valid version.`);
	}

	// Check if this manifest has a nodecg property
	if (!{}.hasOwnProperty.call(pkg, "nodecg")) {
		throw new Error(
			`${pkg.name}'s package.json lacks a "nodecg" property, and therefore cannot be parsed.`,
		);
	}

	if (!semver.validRange(pkg.nodecg.compatibleRange)) {
		throw new Error(
			`${pkg.name}'s package.json does not have a valid "nodecg.compatibleRange" property.`,
		);
	}

	const bundleFolderName = path.parse(bundlePath).base;
	if (bundleFolderName !== pkg.name) {
		logger.warn(
			`The project "${pkg.name}" is installed in the folder "${bundleFolderName}". Using ${pkg.name} as a bundle name.`,
		);
	}

	// Grab the standard properties from the package.json that we care about.
	const manifest: NodeCG.Manifest = {
		...pkg.nodecg,
		name: pkg.name,
		version: pkg.version,
		license: pkg.license,
		description: pkg.description,
		homepage: pkg.homepage,
		author: pkg.author,
		contributors: pkg.contributors,
		transformBareModuleSpecifiers: Boolean(
			pkg.nodecg.transformBareModuleSpecifiers,
		),
	};

	return manifest;
}
