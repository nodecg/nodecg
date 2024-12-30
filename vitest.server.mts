import swc from "vite-plugin-swc-transform";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		swc({
			swcOptions: {
				jsc: {
					target: "es2024",
					transform: {
						legacyDecorator: true,
						decoratorMetadata: true,
						useDefineForClassFields: true,
					},
				},
			},
		}),
	],
	test: {
		include: ["test/**/*.test.ts"],
		exclude: ["test/**/*.browser.test.ts"],
		env: {
			test: "true",
			NODECG_TEST: "true",
		},
	},
});
