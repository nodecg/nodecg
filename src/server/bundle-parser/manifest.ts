import * as path from "path";

import type { NodeCG } from "../../types/nodecg";
import { isLegacyProject } from "../util/project-type";

export function parseManifest(
	pkg: NodeCG.PackageJSON,
	bundlePath: string,
): NodeCG.Manifest {
	if (!pkg.name) {
		throw new Error(`${bundlePath}'s package.json must specify "name".`);
	}

	if (isLegacyProject) {
		// Check if this manifest has a nodecg property
		if (!{}.hasOwnProperty.call(pkg, "nodecg")) {
			throw new Error(
				`${pkg.name}'s package.json lacks a "nodecg" property, and therefore cannot be parsed.`,
			);
		}

		const bundleFolderName = path.basename(bundlePath);
		if (bundleFolderName !== pkg.name) {
			throw new Error(
				`${pkg.name}'s folder is named "${bundleFolderName}". Please rename it to "${pkg.name}".`,
			);
		}
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
			pkg.nodecg?.transformBareModuleSpecifiers,
		),
	};

	return manifest;
}
