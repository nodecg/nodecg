import { Effect } from "effect";

import { recursivelyFindPackageJson } from "../util/nodecg-package-json.js";

export class NodecgPackageJson extends Effect.Service<NodecgPackageJson>()(
	"NodecgPackageJson",
	{
		sync: () => {
			const packageJson = recursivelyFindPackageJson();
			return {
				version: packageJson.version,
			};
		},
	},
) {}
