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
				name: "e2e",
				include: ["test/**/*.test.{ts,tsx}"],
				fileParallelism: false,
				testTimeout: 60_000,
				hookTimeout: 30_000,
			},
		},
			"./workspaces/*",
		],
	},
});
