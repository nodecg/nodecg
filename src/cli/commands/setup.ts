import { execFileSync, execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import stream from "node:stream/promises";

import { confirm } from "@inquirer/prompts";
import chalk from "chalk";
import { Command } from "commander";
import semver from "semver";
import * as tar from "tar";

import { fetchTags } from "../lib/fetch-tags.js";
import type { NpmRelease } from "../lib/sample/npm-release.js";
import { getCurrentNodeCGVersion, pathContainsNodeCG } from "../lib/util.js";

const NODECG_GIT_URL = "https://github.com/nodecg/nodecg.git";

export function setupCommand(program: Command) {
	program
		.command("setup [version]")
		.option("-u, --update", "Update the local NodeCG installation")
		.option(
			"-k, --skip-dependencies",
			"Skip installing npm dependencies",
		)
		.description("Install a new NodeCG instance")
		.action(decideActionVersion);
}

async function decideActionVersion(
	version: string,
	options: { update: boolean; skipDependencies: boolean },
) {
	// If NodeCG is already installed but the `-u` flag was not supplied, display an error and return.
	let isUpdate = false;

	// If NodeCG exists in the cwd, but the `-u` flag was not supplied, display an error and return.
	// If it was supplied, fetch the latest tags and set the `isUpdate` flag to true for later use.
	// Else, if this is a clean, empty directory, then we need to clone a fresh copy of NodeCG into the cwd.
	if (pathContainsNodeCG(process.cwd())) {
		if (!options.update) {
			console.error("NodeCG is already installed in this directory.");
			console.error(
				`Use ${chalk.cyan("nodecg setup [version] -u")} if you want update your existing install.`,
			);
			return;
		}

		isUpdate = true;
	}

	if (version) {
		process.stdout.write(
			`Finding latest release that satisfies semver range ${chalk.magenta(version)}... `,
		);
	} else if (isUpdate) {
		process.stdout.write("Checking against local install for updates... ");
	} else {
		process.stdout.write("Finding latest release... ");
	}

	let tags;
	try {
		tags = fetchTags(NODECG_GIT_URL);
	} catch (error) {
		process.stdout.write(chalk.red("failed!") + os.EOL);
		console.error(error instanceof Error ? error.message : error);
		return;
	}

	let target: string;

	// If a version (or semver range) was supplied, find the latest release that satisfies the range.
	// Else, make the target the newest version.
	if (version) {
		const maxSatisfying = semver.maxSatisfying(tags, version);
		if (!maxSatisfying) {
			process.stdout.write(chalk.red("failed!") + os.EOL);
			console.error(
				`No releases match the supplied semver range (${chalk.magenta(version)})`,
			);
			return;
		}

		target = maxSatisfying;
	} else {
		target = semver.maxSatisfying(tags, "") ?? "";
	}

	process.stdout.write(chalk.green("done!") + os.EOL);

	let current: string | undefined;
	let downgrade = false;

	if (isUpdate) {
		current = getCurrentNodeCGVersion();

		if (semver.eq(target, current)) {
			console.log(
				`The target version (${chalk.magenta(target)}) is equal to the current version (${chalk.magenta(current)}). No action will be taken.`,
			);
			return;
		}

		if (semver.lt(target, current)) {
			console.log(
				`${chalk.red("WARNING:")} The target version (${chalk.magenta(target)}) is older than the current version (${chalk.magenta(current)})`,
			);

			const answer = await confirm({
				message: "Are you sure you wish to continue?",
			});

			if (!answer) {
				console.log("Setup cancelled.");
				return;
			}

			downgrade = true;
		}
	}

	if (semver.lt(target, "v2.0.0")) {
		console.error(
			"nodecg-cli does not support NodeCG versions older than v2.0.0.",
		);
		return;
	}

	await installNodecg(current, target, isUpdate);

	// Install NodeCG's dependencies
	// This operation takes a very long time, so we don't test it.
	if (!options.skipDependencies) {
		installDependencies();
	}

	if (isUpdate) {
		const verb = downgrade ? "downgraded" : "upgraded";
		console.log(`NodeCG ${verb} to ${chalk.magenta(target)}`);
	} else {
		console.log(`NodeCG (${target}) installed to ${process.cwd()}`);
	}
}

async function installNodecg(
	current: string | undefined,
	target: string,
	isUpdate: boolean,
) {
	if (isUpdate) {
		const deletingDirectories = [".git", "build", "scripts", "schemas"];
		await Promise.all(
			deletingDirectories.map((dir) =>
				fs.promises.rm(dir, { recursive: true, force: true }),
			),
		);
	}

	process.stdout.write(`Downloading ${target} from npm... `);

	const targetVersion = semver.coerce(target)?.version;
	if (!targetVersion) {
		throw new Error(`Failed to determine target NodeCG version`);
	}
	const releaseResponse = await fetch(
		`http://registry.npmjs.org/nodecg/${targetVersion}`,
	);
	if (!releaseResponse.ok) {
		throw new Error(
			`Failed to fetch NodeCG release information from npm, status code ${releaseResponse.status}`,
		);
	}
	const release = (await releaseResponse.json()) as NpmRelease;

	process.stdout.write(chalk.green("done!") + os.EOL);

	if (current) {
		const verb = semver.lt(target, current) ? "Downgrading" : "Upgrading";
		process.stdout.write(
			`${verb} from ${chalk.magenta(current)} to ${chalk.magenta(target)}... `,
		);
	}

	const tarballResponse = await fetch(release.dist.tarball);
	if (!tarballResponse.ok || !tarballResponse.body) {
		throw new Error(
			`Failed to fetch release tarball from ${release.dist.tarball}, status code ${tarballResponse.status}`,
		);
	}
	await stream.pipeline(tarballResponse.body, tar.x({ strip: 1 }));
}

function installDependencies() {
	try {
		process.stdout.write("Installing production npm dependencies... ");
		execFileSync("npm", ["install", "--production"]);

		process.stdout.write(chalk.green("done!") + os.EOL);
	} catch (e: any) {
		process.stdout.write(chalk.red("failed!") + os.EOL);
		console.error(e.stack);
		return;
	}
}
