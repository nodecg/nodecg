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
	},
});
