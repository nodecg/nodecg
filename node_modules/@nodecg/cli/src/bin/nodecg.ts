#!/usr/bin/env node

import chalk from "chalk";
import spawn from "nano-spawn";

import { setupCLI } from "..";

try {
	await spawn("git", ["--version"]);
} catch (error) {
	console.error(
		`The CLI requires that ${chalk.cyan("git")} be available in your PATH.`,
	);
	process.exit(1);
}

setupCLI();
