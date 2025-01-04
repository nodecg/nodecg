import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import chalk from "chalk";
import spawn from "nano-spawn";

import { isBundleFolder } from "./util.js";

/**
 * Installs npm dependencies for the NodeCG bundle present at the given path.
 * @param bundlePath - The path of the NodeCG bundle to install dependencies for.
 * @param installDev - Whether to install devDependencies.
 */
export async function installBundleDeps(
	bundlePath: string,
	installDev = false,
) {
	if (!isBundleFolder(bundlePath)) {
		console.error(
			`${chalk.red("Error:")} There doesn't seem to be a valid NodeCG bundle in this folder:\n\t${chalk.magenta(bundlePath)}`,
		);
		process.exit(1);
	}

	const cachedCwd = process.cwd();
	if (fs.existsSync(path.join(bundlePath, "package.json"))) {
		try {
			process.chdir(bundlePath);
			if (fs.existsSync(path.join(bundlePath, "yarn.lock"))) {
				process.stdout.write(
					`Installling npm dependencies with yarn (dev: ${installDev})... `,
				);
				await spawn("yarn", installDev ? [] : ["--production"], {
					cwd: bundlePath,
				});
			} else {
				process.stdout.write(
					`Installing npm dependencies (dev: ${installDev})... `,
				);
				await spawn(
					"npm",
					installDev ? ["install"] : ["install", "--production"],
					{ cwd: bundlePath },
				);
			}

			process.stdout.write(chalk.green("done!") + os.EOL);
		} catch (e: any) {
			/* istanbul ignore next */
			process.stdout.write(chalk.red("failed!") + os.EOL);
			/* istanbul ignore next */
			console.error(e.stack);
			/* istanbul ignore next */
			return;
		}

		process.chdir(cachedCwd);
	}
}
