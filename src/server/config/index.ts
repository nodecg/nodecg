import * as path from "node:path";
import * as fs from "node:fs";
import { argv } from "yargs";
import { loadConfig } from "./loader";
import { NODECG_ROOT } from "../nodecg-root";

const cfgDirectoryPath =
	(argv["cfgPath"] as string) ?? path.join(NODECG_ROOT, "cfg");

// Make 'cfg' folder if it doesn't exist
if (!fs.existsSync(cfgDirectoryPath)) {
	fs.mkdirSync(cfgDirectoryPath, { recursive: true });
}

const { config, filteredConfig } = loadConfig(cfgDirectoryPath);
export { config, filteredConfig };

export const exitOnUncaught = config.exitOnUncaught;

export const sentryEnabled = config.sentry?.enabled;
