import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		testTimeout: 15_000,
		minWorkers: 1,
		maxWorkers: 1,
		env: {
			test: "true",
			NODECG_TEST: "true",
		},
	},
});
