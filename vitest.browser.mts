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
		include: ["test/**/*.browser.test.ts"],
		testTimeout: 15_000,
		hookTimeout: 30_000,
		maxWorkers: 1,
		minWorkers: 1,
		env: {
			test: "true",
			NODECG_TEST: "true",
		},
	},
});
