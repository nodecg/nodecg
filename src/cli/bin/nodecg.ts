#!/usr/bin/env node

import chalk from "chalk";
import spawn from "nano-spawn";

import { setupCLI } from "..";

void spawn("git", ["--version"])
	.catch(() => {
		console.error(
			`The CLI requires that ${chalk.cyan("git")} be available in your PATH.`,
		);
		process.exit(1);
	})
	.then(() => {
		setupCLI();
	});
