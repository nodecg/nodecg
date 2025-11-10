import { defineConfig, type UserConfig } from "tsdown";

const base = {
	tsconfig: true,
	sourcemap: true,
	dts: true,
	fixedExtension: false,
	hash: false,
} satisfies UserConfig;

const lint = {
	attw: true,
	publint: {
		strict: true,
	},
} satisfies UserConfig;

export default defineConfig([
	{
		...base,
		...lint,
		entry: "src/server/bootstrap.ts",
		outDir: "dist/server",
		platform: "node",
		format: "commonjs",
		target: "node20",
		copy: ["src/server/templates"],
	},
	{
		...base,
		entry: "src/client/bundles/*.ts",
		outDir: "dist/client",
		platform: "browser",
		target: "es2020",
		copy: [
			"src/client/manifest.json",
			"src/client/favicon.ico",
			{
				from: "src/client/dashboard/img",
				to: "dist/client/dashboard/img",
			},
			{
				from: "src/client/dashboard/css",
				to: "dist/client/dashboard/css",
			},
			{
				from: "src/client/instance",
				to: "dist/client/instance",
			},
			{
				from: "src/client/login",
				to: "dist/client/login",
			},
		],
		define: {
			"process.env.NODE_ENV": '"production"',
			// Required for "util" package
			"process.env.NODE_DEBUG": "false",
		},
	},
	{
		...base,
		entry: ["src/client/api/api.client.ts"],
		outDir: "out/client",
		format: "commonjs",
		dts: {
			emitDtsOnly: true,
		},
	},
	{
		...base,
		entry: ["src/server/api.server.ts"],
		outDir: "out/server",
		format: "commonjs",
		dts: {
			emitDtsOnly: true,
		},
	},
	{
		...base,
		entry: ["src/shared/replicants.shared.ts"],
		outDir: "out/shared",
		format: "commonjs",
		dts: {
			emitDtsOnly: true,
		},
	},
	{
		...base,
		entry: ["src/types/logger-interface.ts", "src/types/nodecg.ts"],
		outDir: "out/types",
		format: "commonjs",
		dts: {
			emitDtsOnly: true,
		},
	},
]);
