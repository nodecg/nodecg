import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import chalk from "chalk";

import { isBundleFolder } from "./util.js";

/**
 * Installs npm and bower dependencies for the NodeCG bundle present at the given path.
 * @param bundlePath - The path of the NodeCG bundle to install dependencies for.
 * @param installDev - Whether to install devDependencies.
 */
export function installBundleDeps(bundlePath: string, installDev = false) {
	if (!isBundleFolder(bundlePath)) {
		console.error(
			`${chalk.red("Error:")} There doesn't seem to be a valid NodeCG bundle in this folder:\n\t${chalk.magenta(bundlePath)}`,
		);
		process.exit(1);
	}

	let cmdline;

	const cachedCwd = process.cwd();
	if (fs.existsSync(path.join(bundlePath, "package.json"))) {
		process.chdir(bundlePath);
		let cmdline: string;
		if (fs.existsSync(path.join(bundlePath, "yarn.lock"))) {
			cmdline = installDev ? "yarn" : "yarn --production";
			process.stdout.write(
				`Installling npm dependencies with yarn (dev: ${installDev})... `,
			);
		} else {
			cmdline = installDev ? "npm install" : "npm install --production";
			process.stdout.write(
				`Installing npm dependencies (dev: ${installDev})... `,
			);
		}

		try {
			execSync(cmdline, {
				cwd: bundlePath,
				stdio: ["pipe", "pipe", "pipe"],
			});
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

	if (fs.existsSync(path.join(bundlePath, "bower.json"))) {
		cmdline = installDev
			? "npx bower install"
			: "npx bower install --production";
		process.stdout.write(
			`Installing bower dependencies (dev: ${installDev})... `,
		);
		try {
			execSync(cmdline, {
				cwd: bundlePath,
				stdio: ["pipe", "pipe", "pipe"],
			});
			process.stdout.write(chalk.green("done!") + os.EOL);
		} catch (e: any) {
			/* istanbul ignore next */
			process.stdout.write(chalk.red("failed!") + os.EOL);
			/* istanbul ignore next */
			console.error(e.stack);
		}
	}
}
