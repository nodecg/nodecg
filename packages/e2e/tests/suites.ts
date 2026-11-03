import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export interface SuiteConfig {
	readonly runtime?: ReadonlyArray<"node" | "browser">;
	readonly superadmins?: ReadonlyArray<string>;
	readonly collector?: boolean;
}

export interface Suite {
	readonly name: string;
	readonly dir: string;
	readonly serverEntry: string;
	readonly config: Required<SuiteConfig>;
}

export const scanSuites = async (): Promise<ReadonlyArray<Suite>> => {
	const base = import.meta.dirname;
	const names = fs
		.readdirSync(base, { withFileTypes: true })
		.filter((entry) => entry.isDirectory())
		.map((entry) => entry.name)
		.sort();
	return Promise.all(
		names.map(async (name) => {
			const dir = path.join(base, name);
			const configPath = path.join(dir, "config.ts");
			const module: { default?: Partial<SuiteConfig> } = fs.existsSync(
				configPath,
			)
				? await import(pathToFileURL(configPath).href)
				: {};
			return {
				name,
				dir,
				serverEntry: path.join(dir, "server.ts"),
				config: {
					runtime: ["browser"],
					superadmins: [],
					collector: false,
					...module.default,
				},
			};
		}),
	);
};
