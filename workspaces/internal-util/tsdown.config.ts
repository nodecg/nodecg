import { defineConfig } from "tsdown";

export default defineConfig({
	entry: ["src/index.ts", "src/sync.ts"],
	target: "node20",
	tsconfig: true,
	sourcemap: true,
	dts: true,
	fixedExtension: false,
	exports: true,
	attw: {
		profile: "esmOnly",
	},
	publint: {
		strict: true,
	},
});
