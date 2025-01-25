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
		include: ["src/**/*.test.ts", "test/**/*.test.ts"],
		coverage: {
			include: ["src"],
			exclude: ["src/client"],
		},
	},
});
