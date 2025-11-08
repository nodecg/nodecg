import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		env: {
			test: "true",
			NODECG_TEST: "true",
		},
		exclude: ["**/node_modules/**", "**/dist/**", "**/out/**"],
		coverage: {
			include: ["src", "workspaces/*/src"],
			exclude: ["src/client"],
		},
		projects: [
			{
				test: {
					name: "unit",
					include: ["src/**/*.test.{ts,tsx}"],
				},
			},
			{
				test: {
					name: "e2e-legacy-mode",
					include: ["test/legacy-mode/**/*.test.{ts,tsx}"],
					testTimeout: 30_000,
					hookTimeout: 30_000,
				},
			},
			{
				test: {
					name: "e2e-installed-mode",
					include: ["test/installed-mode/**/*.test.{ts,tsx}"],
					testTimeout: 30_000,
					hookTimeout: 30_000,
					fileParallelism: false,
				},
			},
			"./workspaces/*",
		],
	},
});
