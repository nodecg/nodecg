import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		testTimeout: 15_000,
		hookTimeout: 30_000,
		maxWorkers: 1,
		minWorkers: 1,
		env: {
			test: "true",
			NODECG_TEST: "true",
		},
		coverage: {
			include: ["src", "workspaces/*/src"],
			exclude: ["src/client"],
		},
		workspace: [
			{
				extends: true,
				test: {
					name: "root",
					include: ["{src,test}/**/*.test.ts"],
				},
			},
			{
				extends: true,
				test: {
					name: "cli",
					include: ["workspaces/cli/**/*.test.ts"],
				},
			},
		],
	},
});
