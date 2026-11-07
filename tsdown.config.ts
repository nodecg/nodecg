import { defineConfig } from "tsdown";

export default defineConfig({
	workspace: [
		"packages/internal",
		"packages/core",
		"packages/client",
		"packages/browser",
		"packages/server",
	],
	platform: "neutral",
	dts: true,
	fixedExtension: false,
	exports: { devExports: true, packageJson: false },
});
