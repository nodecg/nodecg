import { defineConfig, defineWorkspace } from "vitest/config";

export default defineWorkspace([
	defineConfig({
		test: {
			name: "unit",
			include: ["src/**/*.test.{ts,tsx}"],
		},
	}),
	defineConfig({
		test: {
			name: "e2e",
			include: ["test/**/*.test.{ts,tsx}"],
			fileParallelism: false,
			testTimeout: 15_000,
			hookTimeout: 30_000,
		},
	}),
	"./workspaces/*",
]);
