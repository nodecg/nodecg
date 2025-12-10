import { defineConfig } from "tsdown";

export default defineConfig({
	entry: "src/bin/nodecg.ts",
	target: "node20",
	tsconfig: true,
	sourcemap: true,
	dts: true,
	fixedExtension: false,
	exports: true,
	publint: {
		strict: true,
	},
});
