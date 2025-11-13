import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		env: {
			test: "true",
			NODECG_TEST: "true",
		},
		exclude: ["**/node_modules/**", "**/dist/**", "**/out/**"],
		coverage: {
			include: ["workspaces/*/src"],
			exclude: ["workspaces/nodecg/src/client"],
		},
		projects: [
			{
				test: {
					name: "unit",
					include: ["workspaces/nodecg/src/**/*.test.{ts,tsx}"],
				},
			},
			{
				test: {
					name: "e2e-legacy-mode",
					include: ["workspaces/nodecg/test/legacy-mode/**/*.test.{ts,tsx}"],
					testTimeout: 30_000,
				},
			},
			{
				test: {
					name: "e2e-installed-mode",
					include: ["workspaces/nodecg/test/installed-mode/**/*.test.{ts,tsx}"],
					testTimeout: 30_000,
					fileParallelism: false,
				},
			},
			"workspaces/cli",
			"workspaces/database-adapter-sqlite-legacy",
			"workspaces/database-adapter-types",
			"workspaces/internal-util",
		],
	},
});
