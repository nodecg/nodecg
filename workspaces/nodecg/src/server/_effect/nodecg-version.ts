import { Effect } from "effect";

import { recursivelyFindPackageJson } from "../util/nodecg-package-json.js";

export class NodecgVersion extends Effect.Service<NodecgVersion>()(
	"NodecgVersion",
	{
		sync: () => {
			const packageJson = recursivelyFindPackageJson();
			return {
				version: packageJson.version,
			};
		},
	},
) {}
