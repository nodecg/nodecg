import swcTransform from "vite-plugin-swc-transform";
import { defineConfig } from "vitest/config";

export default defineConfig({
	plugins: [
		swcTransform({
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
		env: {
			test: "true",
			NODECG_TEST: "true",
		},
	},
});
