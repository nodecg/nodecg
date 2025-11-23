import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		env: {
			test: "true",
			NODECG_TEST: "true",
		},
		coverage: {
			include: ["workspaces/*/src"],
			exclude: ["workspaces/nodecg/src/client"],
		},
		projects: [
			{
				test: {
					name: "nodecg",
					dir: "workspaces/nodecg",
					testTimeout: 30_000,
				},
			},
			"workspaces/cli",
			"workspaces/database-adapter-sqlite-legacy",
			"workspaces/database-adapter-types",
			"workspaces/internal-util",
		],
	},
});
