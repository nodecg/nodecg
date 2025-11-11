import { globSync } from "tinyglobby";
import { defineConfig, type UserConfig } from "tsdown";

const base = {
	tsconfig: true,
	sourcemap: true,
	dts: true,
	fixedExtension: false,
	format: "commonjs",
	ignoreWatch: ["./dist"],
} satisfies UserConfig;

const lint = {
	attw: {
		profile: "esmOnly",
	},
	publint: {
		strict: true,
	},
} satisfies UserConfig;

const clientEntries = globSync("src/client/bundles/*.ts", {
	cwd: import.meta.dirname,
});
console.log(clientEntries);
const clientConfigs = clientEntries.map(
	(entry, index) =>
		({
			...base,
			entry,
			outDir: "dist/client",
			platform: "browser",
			target: "es2020",
			format: "iife",
			noExternal: () => true,
			tsconfig: false,
			dts: false,
			outputOptions: {
				entryFileNames: "[name].js",
			},
			treeshake: {
				moduleSideEffects: true,
			},
			define: {
				"process.env.NODE_ENV": '"production"',
				// Required for "util" package
				"process.env.NODE_DEBUG": "false",
			},
			copy:
				index === 0
					? [
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
						]
					: undefined,
		}) satisfies UserConfig,
);

export default defineConfig([
	{
		...base,
		...lint,
		entry: ["src/server/bootstrap.ts"],
		outDir: "dist/server",
		platform: "node",
		target: "node20",
		copy: ["src/server/templates"],
	},
	...clientConfigs,
	{
		...base,
		entry: [
			"src/server/api.server.ts",
			"src/client/api/api.client.ts",
			"src/shared/replicants.shared.ts",
			"src/types/logger-interface.ts",
			"src/types/nodecg.ts",
		],
		outDir: "dist/dts",
		hash: false,
	},
]);
