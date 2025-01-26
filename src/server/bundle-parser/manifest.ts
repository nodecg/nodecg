import * as path from "node:path";

import IOE from "fp-ts/IOEither";
import semver from "semver";

import type { NodeCG } from "../../types/nodecg";
import { isLegacyProject } from "../util/project-type";

export const parseManifest =
	(bundlePath: string) => (packageJson: NodeCG.PackageJSON) => {
		if (!packageJson.name) {
			return IOE.left(
				new Error(`${bundlePath}'s package.json must specify "name".`),
			);
		}

		if (isLegacyProject) {
			if (!packageJson.nodecg) {
				return IOE.left(
					new Error(
						`${packageJson.name}'s package.json lacks a "nodecg" property, and therefore cannot be parsed.`,
					),
				);
			}
			if (!semver.validRange(packageJson.nodecg.compatibleRange)) {
				return IOE.left(
					new Error(
						`${packageJson.name}'s package.json does not have a valid "nodecg.compatibleRange" property.`,
					),
				);
			}
			const bundleFolderName = path.basename(bundlePath);
			if (bundleFolderName !== packageJson.name) {
				return IOE.left(
					new Error(
						`${packageJson.name}'s folder is named "${bundleFolderName}". Please rename it to "${packageJson.name}".`,
					),
				);
			}
		}

		return IOE.right({
			...packageJson.nodecg,
			name: packageJson.name,
			version: packageJson.version,
			license: packageJson.license,
			description: packageJson.description,
			homepage: packageJson.homepage,
			author: packageJson.author,
			contributors: packageJson.contributors,
			transformBareModuleSpecifiers: Boolean(
				packageJson.nodecg?.transformBareModuleSpecifiers,
			),
		} satisfies NodeCG.Manifest);
	};
