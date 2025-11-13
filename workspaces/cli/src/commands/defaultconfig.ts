import fs from "node:fs";
import path from "node:path";

import { rootPaths } from "@nodecg/internal-util";
import { Ajv, type JSONSchemaType } from "ajv";
import chalk from "chalk";
import { Command } from "commander";

import { isBundleFolder } from "../lib/util.js";

const ajv = new Ajv({ useDefaults: true, strict: true });

export function defaultconfigCommand(program: Command) {
	program
		.command("defaultconfig [bundle]")
		.description("Generate default config from configschema.json")
		.action(action);
}

function getBundlePath(bundleName: string): string | null {
	const rootPath = rootPaths.getRuntimeRoot();

	// Check if root project itself is the bundle
	if (isBundleFolder(rootPath)) {
		try {
			const rootPjsonPath = path.join(rootPath, "package.json");
			const rootPjson = JSON.parse(fs.readFileSync(rootPjsonPath, "utf8"));
			if (rootPjson.name === bundleName) {
				return rootPath;
			}
		} catch {
			// Ignore JSON parse errors
		}
	}

	// Otherwise check bundles directory
	const bundlesPath = path.join(rootPath, "bundles", bundleName);
	if (isBundleFolder(bundlesPath)) {
		return bundlesPath;
	}

	return null;
}

function action(bundleName?: string) {
	const cwd = process.cwd();
	const rootPath = rootPaths.getRuntimeRoot();

	let resolvedBundleName: string;

	if (!bundleName) {
		// Check if cwd is a bundle
		if (isBundleFolder(cwd)) {
			const pjson = JSON.parse(
				fs.readFileSync(path.join(cwd, "package.json"), "utf8"),
			);
			resolvedBundleName = pjson.name;
		} else if (isBundleFolder(rootPath)) {
			// Check if root project is a bundle (installed mode)
			const pjson = JSON.parse(
				fs.readFileSync(path.join(rootPath, "package.json"), "utf8"),
			);
			resolvedBundleName = pjson.name;
		} else {
			console.error(
				`${chalk.red("Error:")} No bundle found in the current directory!`,
			);
			return;
		}
	} else {
		resolvedBundleName = bundleName;
	}

	const bundlePath = getBundlePath(resolvedBundleName);
	if (!bundlePath) {
		console.error(
			`${chalk.red("Error:")} Bundle ${resolvedBundleName} does not exist`,
		);
		return;
	}

	const schemaPath = path.join(bundlePath, "configschema.json");
	if (!fs.existsSync(schemaPath)) {
		console.error(
			`${chalk.red("Error:")} Bundle ${resolvedBundleName} does not have a configschema.json`,
		);
		return;
	}

	const cfgPath = path.join(rootPath, "cfg");
	if (!fs.existsSync(cfgPath)) {
		fs.mkdirSync(cfgPath);
	}

	const schema: JSONSchemaType<unknown> = JSON.parse(
		fs.readFileSync(schemaPath, "utf8"),
	);
	const configPath = path.join(cfgPath, `${resolvedBundleName}.json`);
	if (fs.existsSync(configPath)) {
		console.error(
			`${chalk.red("Error:")} Bundle ${resolvedBundleName} already has a config file`,
		);
	} else {
		try {
			const validate = ajv.compile(schema);
			const data = {};
			validate(data);

			fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
			console.log(
				`${chalk.green("Success:")} Created ${chalk.bold(resolvedBundleName)}'s default config from schema\n`,
			);
		} catch (error) {
			console.error(chalk.red("Error:"), error);
		}
	}
}
