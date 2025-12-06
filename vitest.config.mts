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
					name: "unit",
					dir: "workspaces/nodecg/src",
				},
			},
			{
				test: {
					name: "e2e-legacy",
					dir: "workspaces/nodecg/test/legacy-mode",
					hookTimeout: 30_000,
					testTimeout: 30_000,
				},
			},
			{
				test: {
					name: "e2e-installed",
					dir: "workspaces/nodecg/test/installed-mode",
					hookTimeout: 30_000,
					testTimeout: 30_000,
				},
			},
			{
				test: {
					name: "cli",
					dir: "workspaces/cli",
					testTimeout: 10_000,
				},
			},
			"workspaces/database-adapter-sqlite-legacy",
			"workspaces/database-adapter-types",
			"workspaces/internal-util",
		],
	},
});
