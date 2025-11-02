import * as fs from "node:fs";
import * as path from "node:path";

import { getNodecgRoot } from "@nodecg-release-test/internal-util";
import { argv } from "yargs";

import { loadConfig } from "./loader";

const cfgDirectoryPath =
	(argv["cfgPath"] as string) ?? path.join(getNodecgRoot(), "cfg");

// Make 'cfg' folder if it doesn't exist
if (!fs.existsSync(cfgDirectoryPath)) {
	fs.mkdirSync(cfgDirectoryPath, { recursive: true });
}

const { config, filteredConfig } = loadConfig(cfgDirectoryPath);
export { config, filteredConfig };

export const exitOnUncaught = config.exitOnUncaught;

export const sentryEnabled = config.sentry?.enabled;
