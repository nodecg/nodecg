import type { ChangelogFunctions } from "@changesets/types";

export default {
	getReleaseLine: async ({ summary, commit }) => {
		if (typeof commit === "undefined") {
			return `- ${summary}`;
		}
		return `- ${summary} ([${commit.slice(0, 7)}](https://github.com/nodecg/nodecg/commit/${commit}))`;
	},
	getDependencyReleaseLine: async () => "",
} satisfies ChangelogFunctions;
